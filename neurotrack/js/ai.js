/**
 * NeuroTrack AI Module
 * --------------------
 * Fully implemented feedforward neural network and genetic algorithm
 * for 2D top-down racing cars that learn to drive autonomously.
 *
 * No external libraries — pure vanilla JavaScript math.
 */

/* ============================================================
 *  NEURAL NETWORK
 * ============================================================
 *  - Configurable layer sizes (e.g. [7, 8, 6, 4])
 *  - tanh activation on hidden layers, sigmoid on output layer
 *  - Weights + biases stored as a single flat Float64Array
 *    for fast cloning, crossover, and serialization
 * ============================================================ */

class NeuralNetwork {
  /**
   * @param {number[]} layerSizes - e.g. [inputCount, hidden1, hidden2, outputCount]
   */
  constructor(layerSizes) {
    this.layerSizes = layerSizes.slice(); // defensive copy
    this.totalWeights = NeuralNetwork._countWeights(layerSizes);
    // Flat array: all weights followed by all biases for each connection layer
    this.weights = new Float64Array(this.totalWeights);
    this._randomize();
  }

  /* ----------------------------------------------------------
   *  Static helpers
   * ---------------------------------------------------------- */

  /**
   * Count total number of weight + bias parameters for the given topology.
   * Between layer i and layer i+1 there are:
   *   layerSizes[i] * layerSizes[i+1] weights  +  layerSizes[i+1] biases
   */
  static _countWeights(layerSizes) {
    let count = 0;
    for (let i = 0; i < layerSizes.length - 1; i++) {
      const inputs  = layerSizes[i];
      const outputs = layerSizes[i + 1];
      count += inputs * outputs + outputs; // weights + biases
    }
    return count;
  }

  /* ----------------------------------------------------------
   *  Activation functions
   * ---------------------------------------------------------- */

  /** Leaky ReLU — used for hidden layers to prevent vanishing gradients. */
  static _leakyReLU(x) {
    return x > 0 ? x : x * 0.01;
  }

  /** Sigmoid — used for the output layer (maps to 0-1 range). */
  static _sigmoid(x) {
    if (x > 20) return 1;
    if (x < -20) return 0;
    return 1 / (1 + Math.exp(-x));
  }

  /* ----------------------------------------------------------
   *  Initialization
   * ---------------------------------------------------------- */

  /**
   * Xavier/Glorot-style random initialization.
   * Each weight w ~ Uniform(-limit, limit) where limit = sqrt(6 / (fan_in + fan_out)).
   * Biases are initialized to 0.
   */
  _randomize() {
    let offset = 0;
    for (let i = 0; i < this.layerSizes.length - 1; i++) {
      const fanIn  = this.layerSizes[i];
      const fanOut = this.layerSizes[i + 1];
      const limit  = Math.sqrt(6 / (fanIn + fanOut));
      const numWeights = fanIn * fanOut;

      // Fill weights with Xavier uniform
      for (let w = 0; w < numWeights; w++) {
        this.weights[offset + w] = (Math.random() * 2 - 1) * limit;
      }
      offset += numWeights;

      // Biases initialized to 0
      for (let b = 0; b < fanOut; b++) {
        this.weights[offset + b] = 0;
      }
      offset += fanOut;
    }
  }

  /* ----------------------------------------------------------
   *  Forward pass
   * ---------------------------------------------------------- */

  /**
   * Run the network on a set of inputs and return output values.
   * @param {number[]} inputs - length must equal layerSizes[0]
   * @returns {number[]} outputs - length equals layerSizes[last]
   */
  feedforward(inputs) {
    if (inputs.length !== this.layerSizes[0]) {
      throw new Error(
        `Expected ${this.layerSizes[0]} inputs, got ${inputs.length}`
      );
    }

    let activations = Float64Array.from(inputs);
    let offset = 0; // current position in the flat weights array

    for (let layer = 0; layer < this.layerSizes.length - 1; layer++) {
      const inSize  = this.layerSizes[layer];
      const outSize = this.layerSizes[layer + 1];
      const isOutput = (layer === this.layerSizes.length - 2);
      const newActivations = new Float64Array(outSize);

      // Weights for this layer span [offset, offset + inSize * outSize)
      // Biases  for this layer span [offset + inSize * outSize, ... + outSize)
      const weightsStart = offset;
      const biasStart    = offset + inSize * outSize;

      for (let j = 0; j < outSize; j++) {
        let sum = this.weights[biasStart + j]; // start with bias
        for (let i = 0; i < inSize; i++) {
          // Weight index: row-major — neuron j receives input i
          sum += activations[i] * this.weights[weightsStart + i * outSize + j];
        }
        // Apply activation
        newActivations[j] = isOutput
          ? NeuralNetwork._sigmoid(sum)
          : NeuralNetwork._leakyReLU(sum);
      }

      activations = newActivations;
      offset = biasStart + outSize;
    }

    return Array.from(activations);
  }

  /* ----------------------------------------------------------
   *  Genetic operators
   * ---------------------------------------------------------- */

  /**
   * Create an independent deep copy of this network.
   * @returns {NeuralNetwork}
   */
  clone() {
    const copy = new NeuralNetwork(this.layerSizes);
    copy.weights.set(this.weights); // fast typed-array copy
    return copy;
  }

  /**
   * Apply Gaussian mutation to each weight with a given probability.
   * @param {number} rate     - probability each weight is mutated (0-1)
   * @param {number} strength - standard deviation of the Gaussian noise (0-1 typical)
   */
  mutate(rate, strength) {
    for (let i = 0; i < this.weights.length; i++) {
      if (Math.random() < rate) {
        // Box-Muller transform for Gaussian random number
        this.weights[i] += NeuralNetwork._gaussianRandom() * strength;
      }
    }
  }

  /**
   * Uniform crossover between this network and another.
   * Returns TWO children (both new networks).
   * @param {NeuralNetwork} partner
   * @returns {NeuralNetwork[]} [child1, child2]
   */
  crossover(partner) {
    if (this.totalWeights !== partner.totalWeights) {
      throw new Error('Cannot crossover networks with different topologies');
    }

    const child1 = this.clone();
    const child2 = partner.clone();

    // Uniform crossover: each weight has a 50% chance to swap
    for (let i = 0; i < this.totalWeights; i++) {
      if (Math.random() > 0.5) {
        child1.weights[i] = partner.weights[i];
        child2.weights[i] = this.weights[i];
      }
    }

    return [child1, child2];
  }

  /* ----------------------------------------------------------
   *  Serialization
   * ---------------------------------------------------------- */

  /**
   * Serialize the network to a plain JSON-compatible object.
   * @returns {object}
   */
  toJSON() {
    return {
      layerSizes: this.layerSizes.slice(),
      weights: Array.from(this.weights)
    };
  }

  /**
   * Deserialize a network from a JSON object.
   * @param {object} json
   * @returns {NeuralNetwork}
   */
  static fromJSON(json) {
    const nn = new NeuralNetwork(json.layerSizes);
    const w = json.weights;
    for (let i = 0; i < w.length; i++) {
      nn.weights[i] = w[i];
    }
    return nn;
  }

  /* ----------------------------------------------------------
   *  Utility
   * ---------------------------------------------------------- */

  /**
   * Box-Muller transform — returns a single standard-normal random number.
   * @returns {number}
   */
  static _gaussianRandom() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // avoid log(0)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}


/* ============================================================
 *  GENETIC ALGORITHM
 * ============================================================
 *  - Manages a population of neural-network "brains"
 *  - Fitness-proportionate (roulette-wheel) selection
 *  - Single-point crossover of flat weight arrays
 *  - Gaussian mutation with configurable rate and strength
 *  - Elitism: top N% survive unchanged into the next generation
 * ============================================================ */

class GeneticAlgorithm {
  /**
   * @param {object} config
   * @param {number}   config.populationSize  - number of individuals (10-200)
   * @param {number}   config.mutationRate    - percentage (1-50) → converted to 0-1 internally
   * @param {number}   config.mutationStrength- percentage (1-100) → scaled internally
   * @param {number}   config.elitism         - percentage (1-30) of population kept as elites
   * @param {number[]} config.hiddenLayers    - array of hidden layer neuron counts, e.g. [8, 6]
   * @param {number}   config.sensorCount     - number of car sensors (3-15)
   * @param {number}   config.timeLimit        - seconds per generation (5-60)
   */
  constructor(config) {
    this.populationSize   = config.populationSize   || 50;
    this.mutationRate     = (config.mutationRate     || 10) / 100;  // % → decimal
    this.mutationStrength = (config.mutationStrength || 20) / 100;  // % → decimal
    this.elitismPercent   = (config.elitism          || 10) / 100;  // % → decimal
    this.sensorCount      = config.sensorCount       || 5;
    this.memoryCount      = config.memoryCount !== undefined ? config.memoryCount : 2;
    this.timeLimit        = config.timeLimit          || 15; // seconds
    this.hiddenLayers     = config.hiddenLayers       || [8, 6];

    // Network topology: inputs → hidden → outputs
    // Inputs : sensorCount distances + 1 speed + memoryCount
    // Outputs: 4 (accelerate, brake, steer_left, steer_right) + memoryCount
    this.inputCount  = this.sensorCount + 1 + this.memoryCount;
    this.outputCount = 4 + this.memoryCount;
    this.layerSizes  = [this.inputCount, ...this.hiddenLayers, this.outputCount];

    // Population state
    this.population = [];  // Array of { brain: NeuralNetwork, fitness: number }
    this.generation = 0;
    this.bestFitness = 0;
    this.bestBrain   = null;
  }

  /* ----------------------------------------------------------
   *  Population lifecycle
   * ---------------------------------------------------------- */

  /**
   * Create the initial random population.
   */
  initialize() {
    this.population = [];
    this.generation = 0;
    this.bestFitness = 0;
    this.bestBrain = null;

    for (let i = 0; i < this.populationSize; i++) {
      this.population.push({
        brain: new NeuralNetwork(this.layerSizes),
        fitness: 0
      });
    }
  }

  /**
   * Return the array of brains so the simulation can assign them to cars.
   * @returns {NeuralNetwork[]}
   */
  getBrains() {
    return this.population.map(ind => ind.brain);
  }

  /**
   * Record fitness scores after a generation runs.
   * @param {number[]} fitnessValues - one fitness per individual, same order as getBrains()
   */
  evaluate(fitnessValues) {
    if (fitnessValues.length !== this.population.length) {
      throw new Error(
        `Expected ${this.population.length} fitness values, got ${fitnessValues.length}`
      );
    }

    for (let i = 0; i < this.population.length; i++) {
      this.population[i].fitness = fitnessValues[i];
    }

    // Track all-time best
    this._updateBest();
  }

  /**
   * Produce the next generation via selection, crossover, and mutation.
   * Call this AFTER evaluate().
   */
  evolve() {
    const popSize = this.populationSize;

    // --- Sort by fitness descending ---
    this.population.sort((a, b) => b.fitness - a.fitness);

    // --- Elitism: carry top individuals forward unchanged ---
    const eliteCount = Math.max(1, Math.floor(popSize * this.elitismPercent));
    const nextGen = [];

    for (let i = 0; i < eliteCount && i < this.population.length; i++) {
      nextGen.push({
        brain: this.population[i].brain.clone(),
        fitness: 0
      });
    }

    // --- Fill the rest via selection + crossover + mutation ---
    while (nextGen.length < popSize) {
      const parentA = this._selectParent();
      const parentB = this._selectParent();

      let children;
      if (parentA !== parentB) {
        children = parentA.brain.crossover(parentB.brain);
      } else {
        // Self-selected — just clone and mutate
        children = [parentA.brain.clone(), parentA.brain.clone()];
      }

      for (const childBrain of children) {
        if (nextGen.length >= popSize) break;

        childBrain.mutate(this.mutationRate, this.mutationStrength);
        nextGen.push({ brain: childBrain, fitness: 0 });
      }
    }

    this.population = nextGen.slice(0, popSize);
    this.generation++;
  }

  /* ----------------------------------------------------------
   *  Selection
   * ---------------------------------------------------------- */

  /**
   * Tournament Selection (k=4).
   * Picks 4 individuals at random and returns the one with the highest fitness.
   * Provides consistent selection pressure regardless of fitness scaling.
   * @returns {object} selected individual { brain, fitness }
   */
  _selectParent() {
    const pop = this.population;
    const tournamentSize = 4;
    let best = null;

    for (let i = 0; i < tournamentSize; i++) {
      const idx = Math.floor(Math.random() * pop.length);
      const contender = pop[idx];
      if (!best || contender.fitness > best.fitness) {
        best = contender;
      }
    }

    return best || pop[0];
  }

  /* ----------------------------------------------------------
   *  Best-tracking helpers
   * ---------------------------------------------------------- */

  /**
   * Scan current population and update the all-time best brain.
   */
  _updateBest() {
    for (const ind of this.population) {
      if (ind.fitness > this.bestFitness || this.bestBrain === null) {
        this.bestFitness = ind.fitness;
        this.bestBrain = ind.brain.clone();
      }
    }
  }

  /**
   * Get the best brain found so far (deep copy).
   * @returns {NeuralNetwork|null}
   */
  getBestBrain() {
    return this.bestBrain ? this.bestBrain.clone() : null;
  }

  /**
   * Get the best brain from the CURRENT generation (deep copy).
   * @returns {NeuralNetwork|null}
   */
  getCurrentBestBrain() {
    if (this.population.length === 0) return null;

    let best = this.population[0];
    for (let i = 1; i < this.population.length; i++) {
      if (this.population[i].fitness > best.fitness) {
        best = this.population[i];
      }
    }
    return best.brain.clone();
  }

  /**
   * Get statistics for the current generation.
   * @returns {object} { generation, bestFitness, avgFitness, worstFitness, allTimeBest }
   */
  getStats() {
    if (this.population.length === 0) {
      return {
        generation: this.generation,
        bestFitness: 0,
        avgFitness: 0,
        worstFitness: 0,
        allTimeBest: this.bestFitness
      };
    }

    let best = -Infinity, worst = Infinity, sum = 0;
    for (const ind of this.population) {
      if (ind.fitness > best)  best  = ind.fitness;
      if (ind.fitness < worst) worst = ind.fitness;
      sum += ind.fitness;
    }

    return {
      generation: this.generation,
      bestFitness: best,
      avgFitness: sum / this.population.length,
      worstFitness: worst,
      allTimeBest: this.bestFitness
    };
  }

  /* ----------------------------------------------------------
   *  Import / Export
   * ---------------------------------------------------------- */

  /**
   * Export the all-time best brain as a JSON-serializable object.
   * Includes GA metadata for reproducibility.
   * @returns {object|null}
   */
  exportBest() {
    if (!this.bestBrain) return null;

    return {
      version: 1,
      generation: this.generation,
      fitness: this.bestFitness,
      sensorCount: this.sensorCount,
      memoryCount: this.memoryCount,
      hiddenLayers: this.hiddenLayers.slice(),
      brain: this.bestBrain.toJSON()
    };
  }

  /**
   * Import a previously exported brain and install it as the best.
   * Optionally seed it into the current population (slot 0).
   * @param {object} data - object produced by exportBest()
   * @param {boolean} [seedPopulation=true] - if true, overwrite the first
   *   individual in the population with this brain
   * @returns {NeuralNetwork} the imported brain
   */
  importBrain(data, seedPopulation = true) {
    if (!data || !data.brain) {
      throw new Error('Invalid brain data: missing "brain" field');
    }

    const imported = NeuralNetwork.fromJSON(data.brain);
    this.bestBrain = imported.clone();
    this.bestFitness = data.fitness || 0;

    if (seedPopulation && this.population.length > 0) {
      this.population[0].brain = imported.clone();
      this.population[0].fitness = 0;
    }

    return imported;
  }

  /* ----------------------------------------------------------
   *  Config update (for live UI changes between generations)
   * ---------------------------------------------------------- */

  /**
   * Update GA parameters. Topology changes (hiddenLayers, sensorCount) will
   * take effect at the next initialize() call since they change the network
   * structure. Rate/strength/elitism changes take effect immediately.
   * @param {object} config - same shape as the constructor config
   */
  updateConfig(config) {
    if (config.populationSize !== undefined) {
      this.populationSize = config.populationSize;
    }
    if (config.mutationRate !== undefined) {
      this.mutationRate = config.mutationRate / 100;
    }
    if (config.mutationStrength !== undefined) {
      this.mutationStrength = config.mutationStrength / 100;
    }
    if (config.elitism !== undefined) {
      this.elitismPercent = config.elitism / 100;
    }
    if (config.timeLimit !== undefined) {
      this.timeLimit = config.timeLimit;
    }
    if (config.hiddenLayers !== undefined) {
      this.hiddenLayers = config.hiddenLayers;
    }
    if (config.sensorCount !== undefined) {
      this.sensorCount = config.sensorCount;
    }
    if (config.memoryCount !== undefined) {
      this.memoryCount = config.memoryCount;
    }
  }
}


/* ============================================================
 *  EXPORTS — attach to window for global access
 * ============================================================ */

window.NeuralNetwork    = NeuralNetwork;
window.GeneticAlgorithm = GeneticAlgorithm;

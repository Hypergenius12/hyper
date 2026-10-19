using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace SlopcraftLauncher
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                // 1. Locate repository directory
                string exeDir = AppDomain.CurrentDomain.BaseDirectory;
                string repoDir = Path.GetFullPath(Path.Combine(exeDir, ".."));
                if (!File.Exists(Path.Combine(repoDir, "dev_server.js")))
                {
                    repoDir = exeDir;
                }

                // 2. Check if port 8060 is responsive
                if (!IsPortOpen("127.0.0.1", 8060, 400))
                {
                    // Start dev_server.js in background
                    string nodeExe = FindNodeExecutable();
                    string devServerScript = Path.Combine(repoDir, "dev_server.js");

                    if (File.Exists(devServerScript))
                    {
                        ProcessStartInfo serverPsi = new ProcessStartInfo
                        {
                            FileName = nodeExe,
                            Arguments = "\"" + devServerScript + "\"",
                            WorkingDirectory = repoDir,
                            CreateNoWindow = true,
                            UseShellExecute = false,
                            WindowStyle = ProcessWindowStyle.Hidden
                        };
                        try
                        {
                            Process.Start(serverPsi);
                        }
                        catch {}
                    }

                    // Give server up to 2 seconds to bind
                    for (int i = 0; i < 10; i++)
                    {
                        Thread.Sleep(200);
                        if (IsPortOpen("127.0.0.1", 8060, 400)) break;
                    }
                }

                // 3. Locate browser with hardware acceleration support
                string edgePath = FindBrowser();

                // 4. Maximum hardware acceleration and standalone app flags
                string args = "--app=\"http://localhost:8060/\" " +
                              "--enable-gpu-rasterization " +
                              "--ignore-gpu-blocklist " +
                              "--enable-zero-copy " +
                              "--high-dpi-support=1 " +
                              "--force-high-performance-gpu " +
                              "--disable-background-timer-throttling " +
                              "--no-default-browser-check";

                if (!string.IsNullOrEmpty(edgePath) && File.Exists(edgePath))
                {
                    ProcessStartInfo appPsi = new ProcessStartInfo
                    {
                        FileName = edgePath,
                        Arguments = args,
                        UseShellExecute = true
                    };
                    Process.Start(appPsi);
                }
                else
                {
                    // Fallback: system default browser
                    Process.Start("http://localhost:8060/");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Could not launch SlopCraft 3D: " + ex.Message, "SlopCraft 3D", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        static bool IsPortOpen(string host, int port, int timeoutMs)
        {
            try
            {
                using (var client = new TcpClient())
                {
                    var result = client.BeginConnect(host, port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(timeoutMs);
                    if (!success) return false;
                    client.EndConnect(result);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }

        static string FindBrowser()
        {
            string[] paths = new string[]
            {
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe")
            };

            foreach (var p in paths)
            {
                if (File.Exists(p)) return p;
            }
            return null;
        }

        static string FindNodeExecutable()
        {
            string[] nodeCandidates = new string[]
            {
                @"C:\Program Files\nodejs\node.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), @".local\node\node-v20.17.0-win-x64\node.exe")
            };

            foreach (var nc in nodeCandidates)
            {
                if (File.Exists(nc)) return nc;
            }
            return "node";
        }
    }
}

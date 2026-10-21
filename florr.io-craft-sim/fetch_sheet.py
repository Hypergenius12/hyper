import urllib.request
import csv

url = "https://docs.google.com/spreadsheets/d/1E7fS2grTItzOfNfcho00n6EXGTIM-sbzjGGlc0OAhhc/export?format=csv&gid=0"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla'})
try:
    data = urllib.request.urlopen(req).read().decode('utf-8')
    reader = csv.reader(data.splitlines())
    for row in reader:
        if row and ('web' in row[0].lower() or 'electric' in row[0].lower()):
            print("FOUND IN SHEET:", row)
except Exception as e:
    print(e)

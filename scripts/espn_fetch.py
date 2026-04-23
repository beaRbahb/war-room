import requests, json, time

players = [
    "Fernando Mendoza", "Arvell Reese", "David Bailey", "Jeremiyah Love",
    "Francis Mauigoa", "Sonny Styles", "Carnell Tate", "Rueben Bain Jr.",
    "Caleb Downs", "Mansoor Delane", "Spencer Fano", "Monroe Freeling",
    "Makai Lemon", "Jermod McCoy", "Jordyn Tyson", "Olaivavega Ioane",
    "Kenyon Sadiq", "Dillon Thieneman", "Kadyn Proctor", "Keldric Faulk",
    "Akheem Mesidor", "Omar Cooper Jr.", "Emmanuel McNeil-Warren", "Blake Miller",
    "Caleb Lomu", "KC Concepcion", "Avieon Terrell", "Peter Woods",
    "T.J. Parker", "Denzel Boston", "Kayden McDonald", "Cashius Howell",
    "Ty Simpson", "CJ Allen", "Colton Hood", "Max Iheanachor",
    "Zion Young", "Caleb Banks", "Chris Johnson", "Chase Bisontis",
    "Emmanuel Pregnon", "Brandon Cisse", "Malachi Lawrence", "Jacob Rodriguez",
    "Jadarian Price", "Christen Miller", "R Mason Thomas", "Anthony Hill Jr.",
    "Lee Hunter", "Gabe Jacas", "Eli Stowers", "DAngelo Ponds",
    "Chris Bell", "Jake Golday", "Chris Brazzell II", "A.J. Haulcy",
    "Keylan Rutledge", "Treydan Stukes", "Germie Bernard", "Gennings Dunker",
    "Keionte Scott", "Zachariah Branch", "Derrick Moore", "Josiah Trotter",
    "Caleb Tiernan", "Connor Lew", "Domonique Orange", "Mike Washington Jr.",
    "Keith Abney II", "Max Klare", "Dani Dennis-Sutton"
]

results = {}
base = "https://www.espnanalytics.com/draft-predictor/dataUpdate.php"

for player in players:
    r = requests.get(base, params={"player": player, "type": "final", "pick": 0, "pos": "ALL"})
    team_probs = {}
    pick_probs = {}
    if r.status_code == 200:
        for line in r.text.strip().split("\n")[1:]:
            parts = line.split(",")
            if len(parts) >= 12:
                pick, prob, team = int(parts[1]), float(parts[3]), parts[9]
                pick_probs[pick] = round(prob * 100, 1)
                team_probs[team] = round(team_probs.get(team, 0) + prob * 100, 1)
    results[player] = {
        "team_probabilities": dict(sorted(team_probs.items(), key=lambda x: x[1], reverse=True)),
        "pick_probabilities": pick_probs
    }
    print(f"✅ {player}")
    time.sleep(0.3)

with open("espn_probs.json", "w") as f:
    json.dump(results, f, indent=2)
print("Done — paste espn_probs.json back into Claude")
Quest for Today – Git Handleiding 🛠️
🔃 Werken met Git en GitHub
Deze uitleg is voor iedereen die wil meewerken aan het project Quest for Today via Git en GitHub.

📥 1. Project clonen (downloaden van GitHub)
Gebruik deze stap één keer om het project naar je computer te halen:

bash
Kopiëren
Bewerken
git clone https://github.com/jouw-gebruikersnaam/quest-for-today.git
Ga daarna naar de map:

bash
Kopiëren
Bewerken
cd quest-for-today
🔄 2. De nieuwste versie ophalen (pullen)
Voordat je begint met werken, haal je de laatste versie op:

bash
Kopiëren
Bewerken
git pull
✏️ 3. Wijzigingen maken en opslaan (committen)
Bewerk de bestanden

Voeg je wijzigingen toe:

bash
Kopiëren
Bewerken
git add .
Commit je wijzigingen met een korte omschrijving:

bash
Kopiëren
Bewerken
git commit -m "Je bericht hier, bijvoorbeeld: 'tekst aangepast op homepagina'"
🚀 4. Wijzigingen naar GitHub sturen (pushen)
Als je klaar bent met je werk:

bash
Kopiëren
Bewerken
git push
Als dat niet werkt, probeer dan:

bash
Kopiëren
Bewerken
git push -u origin main
Vervang main met dev of een andere branch als dat nodig is.

💡 Extra tips
Gebruik altijd git pull voordat je begint met werken.

Commit vaak, met duidelijke omschrijvingen.

Als er een conflict komt, lees goed wat Git zegt en los het op in de bestanden.

Werk je liever met een app? Gebruik dan GitHub Desktop als visuele tool.


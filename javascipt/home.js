const PREFIX = 'osd';

// Zet nummer om naar letters, a=1, b=2, ..., z=26
function numberToCode(num) {
  let code = '';
  while (num > 0) {
    num--;
    const letter = String.fromCharCode(97 + (num % 26));
    code = letter + code;
    num = Math.floor(num / 26);
  }
  return PREFIX + code;
}

// Omgekeerd: code naar nummer
function codeToNumber(code) {
  if (!code.startsWith(PREFIX)) return null;
  const letters = code.slice(PREFIX.length);
  let num = 0;
  for (let i = 0; i < letters.length; i++) {
    num *= 26;
    num += letters.charCodeAt(i) - 97 + 1;
  }
  return num;
}

// Keys versleutelen
const QUESTS_PER_DAY = 3;
const QUEST_FILE = 'quest.json';

const dailyKey = numberToCode(2);      // bv 'osdb'
const completedKey = numberToCode(3);  // bv 'osdc'
const pointsKey = numberToCode(1);     // bv 'osda'

let allQuests = [];
let dailyQuests = [];

async function start() {
  const response = await fetch(QUEST_FILE);
  allQuests = await response.json();

  dailyQuests = JSON.parse(localStorage.getItem(dailyKey));
  if (!dailyQuests) {
    dailyQuests = getRandomQuests(allQuests, QUESTS_PER_DAY);
    localStorage.setItem(dailyKey, JSON.stringify(dailyQuests));
    localStorage.setItem(completedKey, JSON.stringify([])); // reset voltooid
  }

  renderQuests();
  renderCompleted();
}

function getRandomQuests(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function renderQuests() {
  const container = document.getElementById('quests');
  container.innerHTML = '';

  const completed = JSON.parse(localStorage.getItem(completedKey)) || [];
  const remaining = dailyQuests.filter(q => !completed.some(c => c.id === q.id));

  if (remaining.length === 0) {
    container.innerHTML = '<p>🎉 Alle quests voltooid!</p>';
    return;
  }

  remaining.forEach(q => {
    const div = document.createElement('div');
    div.className = 'quest';
    div.innerHTML = `
      ${q.text} (${q.points} punten)
      <button onclick="completeQuest(${q.id})">Voltooi</button>
    `;
    container.appendChild(div);
  });
}

function completeQuest(id) {
  const quest = dailyQuests.find(q => q.id === id);
  if (!quest) return;

  let completed = JSON.parse(localStorage.getItem(completedKey)) || [];
  if (!completed.find(q => q.id === id)) {
    completed.push(quest);
    localStorage.setItem(completedKey, JSON.stringify(completed));

    // Haal huidige punten op, decode ze, tel bij, encode en sla weer op
    let pointsCode = localStorage.getItem(pointsKey);
    let points = pointsCode ? codeToNumber(pointsCode) : 0;
    points += quest.points;
    localStorage.setItem(pointsKey, numberToCode(points));

    renderCompleted();
    renderQuests();
  }
}

function renderCompleted() {
  const list = document.getElementById('completedQuests');
  const completed = JSON.parse(localStorage.getItem(completedKey)) || [];
  list.innerHTML = '';
  completed.forEach(q => {
    const li = document.createElement('li');
    li.textContent = `${q.text} (${q.points} punten)`;
    list.appendChild(li);
  });

  let pointsCode = localStorage.getItem(pointsKey);
  let points = pointsCode ? codeToNumber(pointsCode) : 0;
  document.getElementById('points').textContent = points;
}

start();

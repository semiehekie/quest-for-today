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

// Constants
const QUESTS_PER_DAY = 3;
const QUEST_FILE = 'data/quest.json';

const dailyKey = numberToCode(2);      // bv 'osdb'
const completedKey = numberToCode(3);  // bv 'osdc'
const pointsKey = numberToCode(1);     // bv 'osda'
const LAST_DATE_KEY = 'osd_date';

let allQuests = [];
let dailyQuests = [];

function getCompletedKey() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  return currentUser ? `completedQuests_${currentUser.naam}` : 'completedQuests_guest';
}

function getPointsKey() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  return currentUser ? `userPoints_${currentUser.naam}` : 'userPoints_guest';
}

function getRerollKey() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  return currentUser ? `rerolled_${currentUser.naam}` : 'rerolled_guest';
}

async function start() {
  const response = await fetch(QUEST_FILE);
  allQuests = await response.json();

  const today = new Date().toISOString().slice(0, 10);
  const lastDate = localStorage.getItem(LAST_DATE_KEY);

  if (lastDate !== today) {
    // Nieuwe dag: ververs quests
    dailyQuests = getRandomQuests(allQuests, QUESTS_PER_DAY);
    localStorage.setItem(dailyKey, JSON.stringify(dailyQuests));
    localStorage.setItem(getCompletedKey(), JSON.stringify([]));
    localStorage.setItem(LAST_DATE_KEY, today);

    // Reset reroll per gebruiker
    localStorage.removeItem(getRerollKey());
  } else {
    // Zelfde dag: laad opgeslagen quests
    dailyQuests = JSON.parse(localStorage.getItem(dailyKey)) || [];
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

  const completed = JSON.parse(localStorage.getItem(getCompletedKey())) || [];
  const remaining = dailyQuests.filter(q => !completed.some(c => c.id === q.id));

  const rerolled = localStorage.getItem(getRerollKey()) === 'true';

  if (remaining.length === 0) {
    container.innerHTML = `<p>🎉 Alle quests voltooid!</p>`;
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

  if (!rerolled) {
    const rerollBtn = document.createElement('button');
    rerollBtn.textContent = '🔁 Reroll naar moeilijkere taken';
    rerollBtn.onclick = rerollToHarderTasks;
    container.appendChild(rerollBtn);
  }
}

function completeQuest(id) {
  const quest = dailyQuests.find(q => q.id === id);
  if (!quest) return;

  let completed = JSON.parse(localStorage.getItem(getCompletedKey())) || [];
  if (!completed.find(q => q.id === id)) {
    completed.push(quest);
    localStorage.setItem(getCompletedKey(), JSON.stringify(completed));

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      currentUser.punten += quest.points;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));

      fetch('/api/update-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          naam: currentUser.naam,
          punten: currentUser.punten
        })
      }).catch(error => console.error('Error updating points:', error));
    } else {
      const pointsKey = getPointsKey();
      let pointsCode = localStorage.getItem(pointsKey);
      let points = pointsCode ? codeToNumber(pointsCode) : 0;
      points += quest.points;
      localStorage.setItem(getPointsKey(), numberToCode(points));
    }

    renderCompleted();
    renderQuests();
  }
}

async function rerollToHarderTasks() {
  try {
    const rerollKey = getRerollKey();
    if (localStorage.getItem(rerollKey) === 'true') return;

    const response = await fetch('data/hardquests.json');
    const hardQuests = await response.json();

    dailyQuests = getRandomQuests(hardQuests, QUESTS_PER_DAY);
    localStorage.setItem(dailyKey, JSON.stringify(dailyQuests));
    localStorage.setItem(getCompletedKey(), JSON.stringify([]));

    // Zet reroll-vlag per gebruiker
    localStorage.setItem(rerollKey, 'true');

    renderQuests();
    renderCompleted();
  } catch (error) {
    console.error('Error loading harder quests:', error);
    alert('Er ging iets mis bij het laden van de moeilijkere taken.');
  }
}

function renderCompleted() {
  const container = document.getElementById('completedQuests');
  container.innerHTML = '';

  const completedKey = getCompletedKey();
  const completed = JSON.parse(localStorage.getItem(completedKey)) || [];
  const list = document.getElementById('completedQuests');
  list.innerHTML = '';
  completed.forEach(q => {
    const li = document.createElement('li');
    li.textContent = `${q.text} (${q.points} punten)`;
    list.appendChild(li);
  });

  let points = 0;
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (currentUser) {
    points = currentUser.punten;
  } else {
    const pointsKey = getPointsKey();
    let pointsCode = localStorage.getItem(pointsKey);
    points = pointsCode ? codeToNumber(pointsCode) : 0;
  }

  document.getElementById('puntenTeller').textContent = points;
}

start();
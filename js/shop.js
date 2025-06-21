(function () {
  const PREFIX = 'osd';

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

  function codeToNumber(code) {
    if (!code.startsWith(PREFIX)) return 0;
    const letters = code.slice(PREFIX.length);
    let num = 0;
    for (let i = 0; i < letters.length; i++) {
      num *= 26;
      num += letters.charCodeAt(i) - 97 + 1;
    }
    return num;
  }

  const pointsKey = numberToCode(1); // 'osda'

  function getPunten() {
    // Check if user is logged in first
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      return currentUser.punten;
    }
    
    // Fallback to encoded points for guest users
    const code = localStorage.getItem(pointsKey);
    return code ? codeToNumber(code) : 0;
  }

  function setPunten(nieuwePunten) {
    // Check if user is logged in first
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      currentUser.punten = nieuwePunten;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      // Update points on server
      fetch('/api/update-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          naam: currentUser.naam,
          punten: nieuwePunten
        })
      }).catch(error => console.error('Error updating points:', error));
    } else {
      // Fallback to encoded points for guest users
      const nieuweCode = numberToCode(nieuwePunten);
      localStorage.setItem(pointsKey, nieuweCode);
    }
    updatePuntenTeller();
  }

  function updatePuntenTeller() {
    const teller = document.getElementById("puntenTeller");
    if (teller) {
      teller.textContent = getPunten();
    }
  }

  function getGekochtGamesKey() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return currentUser ? `gekochtGames_${currentUser.naam}` : 'gekochtGames_guest';
  }

  function isGameGekocht(gameNaam) {
    const gekochtGames = JSON.parse(localStorage.getItem(getGekochtGamesKey()) || '[]');
    return gekochtGames.includes(gameNaam);
  }

  function voegGameToeAanGekocht(gameNaam) {
    const key = getGekochtGamesKey();
    const gekochtGames = JSON.parse(localStorage.getItem(key) || '[]');
    if (!gekochtGames.includes(gameNaam)) {
      gekochtGames.push(gameNaam);
      localStorage.setItem(key, JSON.stringify(gekochtGames));
    }
  }

  window.koopGame = function (naam, prijs, downloadLink) {
    if (isGameGekocht(naam)) {
      alert(`✅ Je hebt "${naam}" al gekocht! De download wordt geopend.`);
      window.open(downloadLink, "_blank");
      return;
    }

    const punten = getPunten();
    if (punten >= prijs) {
      if (confirm(`Wil je "${naam}" kopen voor ${prijs} punten?`)) {
        setPunten(punten - prijs);
        voegGameToeAanGekocht(naam);
        alert(`✅ Je hebt "${naam}" gekocht!`);
        window.open(downloadLink, "_blank");
        updateGameButtons();
      }
    } else {
      alert("🚫 Je hebt niet genoeg punten.");
    }
  };

  function updateGameButtons() {
    const productButtons = document.querySelectorAll('.product button');
    productButtons.forEach(button => {
      const onclickAttr = button.getAttribute('onclick');
      // Extract the first parameter (game name) from koopGame function call
      const matches = onclickAttr.match(/koopGame\('([^']+)'/);
      if (matches) {
        const gameNaam = matches[1];
        if (isGameGekocht(gameNaam)) {
          button.textContent = 'Al gekocht - Download';
          button.style.backgroundColor = '#28a745';
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function() {
    updatePuntenTeller();
    updateGameButtons();
  });
})();

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
    const code = localStorage.getItem(pointsKey);
    return code ? codeToNumber(code) : 0;
  }

  function setPunten(nieuwePunten) {
    const nieuweCode = numberToCode(nieuwePunten);
    localStorage.setItem(pointsKey, nieuweCode);
    updatePuntenTeller();
  }

  function updatePuntenTeller() {
    const teller = document.getElementById("puntenTeller");
    if (teller) {
      teller.textContent = getPunten();
    }
  }

  window.koopGame = function (naam, prijs, downloadLink) {
    const punten = getPunten();
    if (punten >= prijs) {
      if (confirm(`Wil je "${naam}" kopen voor ${prijs} punten?`)) {
        setPunten(punten - prijs);
        alert(`✅ Je hebt "${naam}" gekocht!`);
        window.open(downloadLink, "_blank");
      }
    } else {
      alert("🚫 Je hebt niet genoeg punten.");
    }
  };

  document.addEventListener("DOMContentLoaded", updatePuntenTeller);
})();

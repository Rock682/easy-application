// Popup for Intermediate Results

function showResultPopup() {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(0,0,0,0.6)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '9999';

  // Create popup card
  const card = document.createElement('div');
  card.style.background = '#fff';
  card.style.padding = '20px';
  card.style.borderRadius = '10px';
  card.style.textAlign = 'center';
  card.style.width = '300px';
  card.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';

  card.innerHTML = `
    <h2>📢 Intermediate Results Released</h2>
    <p>Click below to check your results</p>
    <a href="https://resultsbie.ap.gov.in/" target="_blank" 
       style="display:inline-block;margin-top:10px;padding:10px 15px;background:#007bff;color:#fff;border-radius:5px;text-decoration:none;">
       View Results
    </a>
    <br/><br/>
    <button id="closePopup" style="padding:6px 12px;border:none;background:#dc3545;color:#fff;border-radius:5px;cursor:pointer;">Close</button>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Close button
  card.querySelector('#closePopup').onclick = () => {
    document.body.removeChild(overlay);
  };
}

// Show popup every 5 minutes
setInterval(showResultPopup, 5 * 60 * 1000);

// Show immediately on load
window.onload = showResultPopup;

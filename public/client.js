// Fetch and display application status
async function loadStatus() {
  try {
    const response = await fetch('/api/info');
    const data = await response.json();

    const statusBox = document.getElementById('status-info');
    statusBox.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span class="status-indicator"></span>
        <div>
          <strong>${data.name}</strong> v${data.version}<br>
          Environment: <em>${data.environment}</em>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading status:', error);
    document.getElementById('status-info').innerHTML = `
      <p>Status: <strong>Error loading application info</strong></p>
    `;
  }
}

// Load status when page loads
document.addEventListener('DOMContentLoaded', loadStatus);

// Auto-refresh status every 10 seconds
setInterval(loadStatus, 10000);

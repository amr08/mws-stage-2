
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('../sw.js')
      .then(registration => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                addToast(installingWorker);
              } else {
                console.log('Content is cached for offline use.');
              }
            }
            //If user selects update, reload
            if(installingWorker.state === 'activated'){
              window.location.reload();
            }     
          }
        }
      });
  });
}

const addToast = (installingWorker) => {
  const body = document.getElementsByTagName("body")[0];
  const toastDiv = document.createElement("div");
  toastDiv.classList.add("toast");
  toastDiv.innerHTML = "Content update available";
  toastDiv.setAttribute("id", "toast");
  toastDiv.setAttribute("aria-label", "service-worker-update")


  const acceptButton = document.createElement("button");
  const dismissButton = document.createElement("button");

  acceptButton.classList.add("button-toast");
  acceptButton.focus();
  acceptButton.setAttribute("tabindex", "0");
  acceptButton.innerHTML = "Accept";
  acceptButton.onclick = () => {
    installingWorker.postMessage({update: true});
  }

  dismissButton.classList.add("button-toast");
  dismissButton.innerHTML = "Dismiss";
  dismissButton.setAttribute("tabindex", "1");
  dismissButton.onclick = () => {
    const getToastDiv = document.getElementById("toast");
    getToastDiv.parentNode.removeChild(getToastDiv);
  }

  toastDiv.appendChild(acceptButton);
  toastDiv.appendChild(dismissButton);

  body.appendChild(toastDiv);
}
/* eslint-disable */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('../sw.js')
      .then(registration => {
      
        if("sync" in registration){
          console.log(registration)

     
          //Listen for changes to form in order to track submit button then send sync message to sw
          observer(registration);
        }
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

function observer(registration){

  if(window.location.pathname.startsWith("/restaurant")) {
    var targetNode = document.getElementById('reviews-container');

    // Options for the observer (which mutations to observe)
    var config = { attributes: true, childList: true, subtree: true };

    var callback = function(mutationsList) {
      for(var mutation of mutationsList) {

          if (mutation.type == 'childList') {
            if(mutation.target.id === "reviews-form"){
              const submitIntercept = document.getElementById("submit-button");
                submitIntercept.addEventListener("click", e => { 
                  e.preventDefault();
                  const nameValue = document.getElementById("name");
                  const idValue = document.getElementById("id")
                  const commentsValue = document.getElementById("comments");
                  const ratingValue = document.getElementById("rating");
              
                  const postReview = 
                    {
                      "restaurant_id": parseInt(idValue.dataset.restaurant), 
                      "name": nameValue.value,  
                      "rating":  parseInt(ratingValue.options[ratingValue.selectedIndex].value),
                      "comments": commentsValue.value
                    }
                    console.log(postReview)

                    DBHelper.postReviews(postReview, parseInt(idValue.value));
                    registration.sync.register(JSON.stringify(postReview));
                    const reviewsContainer = document.getElementById("reviews-container");
                    reviewsContainer.innerHTML = "";
                    return;
               });
            } 
          }
          else if (mutation.type == 'attributes') {
              // console.log('The ' + mutation.attributeName + ' attribute was modified.');
          }
      }
    };


 

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);

  }
}

// window.addEventListener('load', function() {
  // var status = document.getElementById("status");
  // var log = document.getElementById("log");

  function updateOnlineStatus(event) {
    // var condition = navigator.onLine ? "online" : "offline";
    if(event.type === "offline"){
      const body = document.getElementsByTagName("body")[0];
      const toastDiv = document.createElement("div");
      toastDiv.classList.add("toast");
      toastDiv.innerHTML = "You are operating offline";
      toastDiv.setAttribute("id", "toast");
      toastDiv.setAttribute("aria-label", "service-worker-update-offline")

      const dismissButton = document.createElement("button");
      toastDiv.appendChild(dismissButton);

      dismissButton.classList.add("button-toast");
      dismissButton.innerHTML = "Dismiss";
      dismissButton.setAttribute("tabindex", "1");
      dismissButton.onclick = () => {
        const getToastDiv = document.getElementById("toast"); 
        getToastDiv.parentNode.removeChild(getToastDiv);
      }

      body.appendChild(toastDiv);
    } else {
      if(document.getElementById("toast")){
        const getToastDiv = document.getElementById("toast"); 
        getToastDiv.parentNode.removeChild(getToastDiv);

      }
    }
    // status.className = condition;
    // status.innerHTML = condition.toUpperCase();

    // log.insertAdjacentHTML("beforeend", "Event: " + event.type + "; Status: " + condition);
  }

  window.addEventListener('online',  updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
// });



/* eslint-disable */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('../sw.js')
      .then(registration => {
        if("sync" in registration){
          // console.log("yas");
          // console.log(registration)
          // const reviewButton = document.getElementById("review-button");
          // console.log(reviewButton)
          // if(reviewButton.onclick){
          //   console.log(true)

          observer(registration);
          // }
          // const submitButton = document.getElementById("submit-button");
          // console.log(submitButton)
          // submitButton.onclick = () => {
          //   console.log("cool");
          // }
          
          // console.log("yas");
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

                    DBHelper.postReviews(postReview, parseInt(idValue.value));
                    registration.sync.register(JSON.stringify(postReview));
                    return;
               });
            }
             
          }
          else if (mutation.type == 'attributes') {
              console.log('The ' + mutation.attributeName + ' attribute was modified.');
          }
      }
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);

  }
}
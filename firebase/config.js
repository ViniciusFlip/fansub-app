 
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"

import { getAuth }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"

import { getFirestore }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"

const firebaseConfig = {

  apiKey: "AIzaSyCfvYGoeIDbxvFC5KomCSrVlVfk_RCR94o",
  authDomain: "omda-build.firebaseapp.com",
  projectId: "omda-build",
  storageBucket: "omda-build.firebasestorage.app",
  messagingSenderId: "37877100605",
  appId: "1:37877100605:web:e4218b7515f8e80a9bba54"

}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

export const db = getFirestore(app)
 
 









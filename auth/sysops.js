import {
signInWithEmailAndPassword
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"


import {
auth
}
from "../firebase/config.js"



const form =
document.getElementById("loginForm")



form.addEventListener(
"submit",
async(e)=>{


e.preventDefault()



const email =
document.getElementById("email").value



const password =
document.getElementById("password").value



try{


const result =
await signInWithEmailAndPassword(
auth,
email,
password
)



localStorage.setItem(
"uid",
result.user.uid
)


    simularLogin() 
       
         setTimeout(() => {
        window.location.href = "https://viniciusflip.github.io/fansub-app/admin/hub/";
    }, 3000);


}catch(err){


alert("Login inválido")


console.log(err)


}



})
 
import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"

import { auth } from "../firebase/config.js"

const loginForm = document.getElementById('loginForm')

loginForm.addEventListener('submit', async (e) => {

    e.preventDefault()

    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        )

        alert('Login realizado!')

        window.location.href = "/admin/hub/"

    } catch (error) {

        console.error(error)

        alert('Login inválido')

    }

})
 

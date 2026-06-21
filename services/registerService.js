
import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"

import {
    auth,
    db
} from "../firebase/config.js"

const registerForm = document.getElementById('registerForm')

registerForm.addEventListener('submit', async (e) => {

    e.preventDefault()

    try {

        const name =
        document.getElementById('registerName').value.trim()

        const email =
        document.getElementById('registerEmail').value.trim()

        const password =
        document.getElementById('registerPassword').value

        const confirmPassword =
        document.getElementById('registerConfirmPassword').value

        if(password !== confirmPassword){
            alert('As senhas não coincidem')
            return
        }

        console.log('1 - criando usuário')

        const userCredential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        )

        const user = userCredential.user

        console.log('2 - usuário criado', user.uid)

        await updateProfile(user, {
            displayName: name
        })

        console.log('3 - perfil atualizado')

        console.log('4 - salvando firestore')

        await setDoc(
            doc(db, "users", user.uid),
            {
                uid: user.uid,
                name: name,
                email: email,
                role: "client",
                status: "active",
                downloads: 0,
                createdAt: serverTimestamp()
            }
        )

        console.log('5 - firestore salvo')

        alert('Conta criada com sucesso')

        // window.location.href = "/"

    } catch (error) {

        console.error('ERRO COMPLETO:', error)

        alert(error.message)

    }

})
  

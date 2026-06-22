import {
    auth,
    db,
    doc,
    setDoc,
    getDocs,
    collection,
    serverTimestamp
} from "../firebase/config.js";


import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";



export async function addUser(userData) {


    const result =
    await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
    );


    const user = result.user;


    await updateProfile(user,{
        displayName:userData.name
    });



    await setDoc(
        doc(
            db,
            "users",
            user.uid
        ),
        {
            uid:user.uid,

            username:userData.username,

            usernameLower:
            userData.usernameLower,

            name:userData.name,

            email:userData.email,

            emailLower:
            userData.emailLower,

            role:userData.role,

            status:userData.status,

            bio:userData.bio,

            avatar:userData.avatar,

            downloads:0,

            createdAt:serverTimestamp(),

            updatedAt:serverTimestamp()
        }
    );


    return user.uid;
}



export async function getUsers() {


    const snapshot =
    await getDocs(
        collection(db,"users")
    );


    return snapshot.docs.map(doc=>({
        id:doc.id,
        ...doc.data()
    }));

}
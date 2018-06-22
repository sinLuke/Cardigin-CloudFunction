const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

var db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.setAFollowB = functions.https.onCall((data, context) => {
	const userAUID = data.a
	const userBUID = data.b
	if(userAUID === userBUID){
		return
	}
	return Promise.all([writeAFollowing(userAUID, userBUID), writeBFollower(userAUID, userBUID)])
});

exports.setAUnfollowB = functions.https.onCall((data, context) => {
	const userAUID = data.a
	const userBUID = data.b
	if(userAUID === userBUID){
		return
	}
	return Promise.all([writeAUnfollowing(userAUID, userBUID), writeBUnfollower(userAUID, userBUID)])
});

exports.ifAFollowedB = functions.https.onCall((data, context) => {
	const userAUID = data.a
	const userBUID = data.b
	return db.collection('users').doc(userAUID).collection('following').get().then(snap => {
		var returnValue = false
		snap.forEach(doc => {
			if (doc.data().id === userBUID){
				returnValue = true
			}
		})
		return {
			value: returnValue
		}
	})
});

exports.getPostFeedREFsForUser = functions.https.onCall((data, context) => {
	return getFollowingUserUIDsForUser(data.UID).then(followingUserUIDList => {
		console.log("followingUserUIDList", followingUserUIDList)
		var returnValue = []
		var returnPromise = []

		returnPromise.push(db.collection('users').doc(data.UID).collection('posts').get().then(snap => {
			snap.forEach(doc => {
				returnValue.push(doc.data().ref.id)
			})
			return null
		}))

		followingUserUIDList.forEach(followingUID => {
			console.log("followingUID", followingUID)
			returnPromise.push(db.collection('users').doc(followingUID).collection('posts').get().then(snap => {
				snap.forEach(doc => {
					returnValue.push(doc.data().ref.id)
				})
				return null
			}))
			
		})
		console.log("returnValue", returnValue)

		return Promise.all(returnPromise).then(_ => {
			console.log("returnValue", returnValue)
			return {
				a: 'a',
				value: returnValue
			}
		})
	})
});

function getFollowingUserUIDsForUser(uid){
	return db.collection('users').doc(uid).collection('following').get().then(snap => {
		var returnValue = []
		snap.forEach(doc => {
			returnValue.push(doc.data().id)
		})
		return returnValue
	})
}

function writeAFollowing(userAUID, userBUID){
	return db.collection('users').doc(userAUID).collection('following').doc(userBUID).set({
		id: userBUID
	})
}

function writeBFollower(userAUID, userBUID){
	return db.collection('users').doc(userBUID).collection('follower').doc(userAUID).set({
		id: userAUID
	})
}

function writeAUnfollowing(userAUID, userBUID){
	return db.collection('users').doc(userAUID).collection('following').doc(userBUID).delete()
}

function writeBUnollower(userAUID, userBUID){
	return db.collection('users').doc(userBUID).collection('follower').doc(userAUID).delete()
}



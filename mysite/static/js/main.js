



'use strict';

const baseURL = "/"

let localVideo = document.querySelector('#localVideo');
let remoteVideo = document.querySelector('#remoteVideo');

let otherUser;
let remoteRTCMessage;

let iceCandidatesFromCaller = [];
let peerConnection;
let remoteStream;
let localStream;

let callInProgress = false;


// function autoLogin() {
//     let userName = "{{ logged_in_user.username }}"; // Django template variable
//     myName = userName;

//     connectSocket(); // Connect to WebSocket upon page load
// }

// document.addEventListener('DOMContentLoaded', autoLogin); // Call autoLogin when the DOM is fully loaded

//event from html
function call() {
    let userToCall = document.getElementById("callName").value;
    otherUser = userToCall;
    document.getElementById('ringingSound').play();

    beReady()
        .then(bool => {
            processCall(userToCall);
            document.getElementById("endCallButton").style.display = "block";
        })
}

//event from html
function answer() {
    //do the event firing

    beReady()
        .then(bool => {
            processAccept();
        })

    document.getElementById("answer").style.display = "none";

    resetCallUI();
}

// let pcConfig = {
//     "iceServers":
//         [
//             { "url": "stun:stun.jap.bloggernepal.com:5349" },
//             {
//                 "url": "turn:turn.jap.bloggernepal.com:5349",
//                 "username": "guest",
//                 "credential": "somepassword"
//             },
//             {"url": "stun:stun.l.google.com:19302"}
//         ]
// };

let pcConfig = null;
// Set up audio and video regardless of what devices are present.
let sdpConstraints = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};

/////////////////////////////////////////////

let socket;
let callSocket;
function connectSocket(myName, receiver) {
    let ws_scheme = window.location.protocol == "https:" ? "wss://" : "ws://";
    console.log(ws_scheme);

    callSocket = new WebSocket(
        ws_scheme
        + window.location.host
        + '/ws/call/'
    );

    callSocket.onopen = event => {
        //let's send myName to the socket
        if (myName) {
            callSocket.send(JSON.stringify({
                type: 'login',
                data: {
                    name: myName,
                    receiver: receiver
                }
            }));
        } else {
            console.error("Username is not set");
        }
    }

    callSocket.onmessage = (e) => {
        console.log("WebSocket message received: ", e.data);
        let response = JSON.parse(e.data);
        // var type = data.type;


        // console.log(response);

        let type = response.type;

        if (type == 'connection') {
            console.log(response.data.message)
        }

        if (type == 'call_received') {
            // console.log(response);
            document.getElementById("declineCallButton").style.display = "block";
            onNewCall(response.data)
            console.log('Incoming call from ' + data.data.call_from);
        }

        if (type == 'call_answered') {
            onCallAnswered(response.data);
        }

        if (type == 'ICEcandidate') {
            onICECandidate(response.data);
        }
        if (response.type === 'chat_message') {
            displayChatMessage(response.data.message, response.data.sender);
        }

        switch (type) {
            case 'call_declined':
                // alert("Call declined by the receiver.");
                resetCallUI();
                // Reset the UI as needed
                break;
            case 'call_ended':
                // alert("Call ended by the caller.");
                resetCallUI();
                // Reset the UI as needed
                break;
            // Handle other message types
        }
        if (type === 'call_recording_saved') {
            // Extract the file URL
            let fileUrl = response.file_url;

            // Trigger the download
            let a = document.createElement('a');
            a.href = fileUrl;
            a.download = 'CallRecording.ogg'; // Or any other filename you wish
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        switch (type) {
            case 'new_message_notification':
                console.log('ffffx')

                // Call a function to update the UI with the new unread messages count
                updateUnreadMessagesCount(response.unread_count);
                break;
        }






    }

    const onNewCall = (data) => {
        //when other called you
        //show answer button

        otherUser = data.caller;
        remoteRTCMessage = data.rtcMessage

        // document.getElementById("profileImageA").src = baseURL + callerProfile.image;
        document.getElementById("callerName").innerHTML = otherUser;
        document.getElementById("call").style.display = "none";
        document.getElementById("answer").style.display = "block";
    }

    const onCallAnswered = (data) => {
        resetCallUI();
        //when other accept our call
        remoteRTCMessage = data.rtcMessage
        peerConnection.setRemoteDescription(new RTCSessionDescription(remoteRTCMessage));

        document.getElementById("calling").style.display = "none";

        console.log("Call Started. They Answered");
        // console.log(pc);

        callProgress()
    }

    const onICECandidate = (data) => {
        // console.log(data);
        console.log("GOT ICE candidate");

        let message = data.rtcMessage

        let candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate
        });

        if (peerConnection) {
            console.log("ICE candidate Added");
            peerConnection.addIceCandidate(candidate);
        } else {
            console.log("ICE candidate Pushed");
            iceCandidatesFromCaller.push(candidate);
        }

    }

}

/**
 * 
 * @param {Object} data 
 * @param {number} data.name - the name of the user to call
 * @param {Object} data.rtcMessage - the rtc create offer object
 */
function sendCall(data) {
    //to send a call
    console.log("Send Call");

    // socket.emit("call", data);
    callSocket.send(JSON.stringify({
        type: 'call',
        data
    }));

    document.getElementById("call").style.display = "none";
    // document.getElementById("profileImageCA").src = baseURL + otherUserProfile.image;
    document.getElementById("otherUserNameCA").innerHTML = otherUser;
    document.getElementById("calling").style.display = "block";
}



/**
 * 
 * @param {Object} data 
 * @param {number} data.caller - the caller name
 * @param {Object} data.rtcMessage - answer rtc sessionDescription object
 */
function answerCall(data) {
    //to answer a call
    // socket.emit("answerCall", data);
    callSocket.send(JSON.stringify({
        type: 'answer_call',
        data
    }));
    callProgress();
}

/**
 * 
 * @param {Object} data 
 * @param {number} data.user - the other user //either callee or caller 
 * @param {Object} data.rtcMessage - iceCandidate data 
 */
function sendICEcandidate(data) {
    //send only if we have caller, else no need to
    console.log("Send ICE candidate");
    // socket.emit("ICEcandidate", data)
    callSocket.send(JSON.stringify({
        type: 'ICEcandidate',
        data
    }));

}

function beReady() {
    return navigator.mediaDevices.getUserMedia({
        audio: true
        // video: true  
    })
        .then(stream => {
            localStream = stream;
            localVideo.srcObject = stream;

            return createConnectionAndAddStream()
        })
        .catch(function (e) {
            alert('getUserMedia() error: ' + e.name);
        });
}

function createConnectionAndAddStream() {
    createPeerConnection();
    peerConnection.addStream(localStream);
    return true;
}

function processCall(userName) {
    peerConnection.createOffer((sessionDescription) => {
        peerConnection.setLocalDescription(sessionDescription);
        sendCall({
            name: userName,
            rtcMessage: sessionDescription
        })
    }, (error) => {
        console.log("Error");
    });
}

function processAccept() {

    peerConnection.setRemoteDescription(new RTCSessionDescription(remoteRTCMessage));
    peerConnection.createAnswer((sessionDescription) => {
        peerConnection.setLocalDescription(sessionDescription);

        if (iceCandidatesFromCaller.length > 0) {
            //I am having issues with call not being processed in real world (internet, not local)
            //so I will push iceCandidates I received after the call arrived, push it and, once we accept
            //add it as ice candidate
            //if the offer rtc message contains all thes ICE candidates we can ingore this.
            for (let i = 0; i < iceCandidatesFromCaller.length; i++) {
                //
                let candidate = iceCandidatesFromCaller[i];
                console.log("ICE candidate Added From queue");
                try {
                    peerConnection.addIceCandidate(candidate).then(done => {
                        console.log(done);
                    }).catch(error => {
                        console.log(error);
                    })
                } catch (error) {
                    console.log(error);
                }
            }
            iceCandidatesFromCaller = [];
            console.log("ICE candidate queue cleared");
        } else {
            console.log("NO Ice candidate in queue");
        }

        answerCall({
            caller: otherUser,
            rtcMessage: sessionDescription
        })

    }, (error) => {
        console.log("Error");
    })
}

/////////////////////////////////////////////////////////

function createPeerConnection() {
    try {
        peerConnection = new RTCPeerConnection(pcConfig);
        // peerConnection = new RTCPeerConnection();
        peerConnection.onicecandidate = handleIceCandidate;
        peerConnection.onaddstream = handleRemoteStreamAdded;
        peerConnection.onremovestream = handleRemoteStreamRemoved;
        console.log('Created RTCPeerConnnection');
        return;
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
}

function handleIceCandidate(event) {
    // console.log('icecandidate event: ', event);
    if (event.candidate) {
        console.log("Local ICE candidate");
        // console.log(event.candidate.candidate);

        sendICEcandidate({
            user: otherUser,
            rtcMessage: {
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            }
        })

    } else {
        console.log('End of candidates.');
    }
}

function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteStream = event.stream;
    remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
    remoteVideo.srcObject = null;
    localVideo.srcObject = null;
}

window.onbeforeunload = function () {
    if (callInProgress) {
        stop();
    }
};


function stop() {
    localStream.getTracks().forEach(track => track.stop());
    callInProgress = false;
    peerConnection.close();
    peerConnection = null;
    document.getElementById("call").style.display = "block";
    document.getElementById("answer").style.display = "none";
    document.getElementById("inCall").style.display = "none";
    document.getElementById("calling").style.display = "none";
    document.getElementById("endVideoButton").style.display = "none"
    otherUser = null;
}

function callProgress() {

    document.getElementById("videos").style.display = "block";
    document.getElementById("otherUserNameC").innerHTML = otherUser;
    document.getElementById("inCall").style.display = "block";
    document.getElementById("callActions").style.display = "block";
    document.getElementById("callRecordActions").style.display = "block";

    callInProgress = true;
}

function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
        peerConnection.close();
    }
    peerConnection = null;
    // Reset UI elements
    document.getElementById("videos").style.display = "none";
    document.getElementById("inCall").style.display = "none";
    document.getElementById("call").style.display = "block";
    document.getElementById("callActions").style.display = "none";
    document.getElementById("callRecordActions").style.display = "none";
    // Optionally, send a message to the other peer to end the call on their side as well
}

function toggleVideo() {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            if (videoTrack.enabled) {
                document.getElementById("toggleVideoButton").textContent = "Turn Off Video";
            } else {
                document.getElementById("toggleVideoButton").textContent = "Turn On Video";
            }
        }
    }
}

function toggleAudio() {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            if (audioTrack.enabled) {
                document.getElementById("toggleAudioButton").textContent = "Mute Audio";
            } else {
                document.getElementById("toggleAudioButton").textContent = "Unmute Audio";
            }
        }
    }
}

function sendChatMessage() {
    const messageInput = document.getElementById("chatMessage");
    const message = messageInput.value;
    if (message.trim() === "") return;  // Don't send empty messages

    // Assume 'myName' is the username of the sender, adjust as needed
    callSocket.send(JSON.stringify({
        type: 'chat_message',
        data: { message: message, sender: myName, receiver: receiver }
    }));
    console.log("Sending message:", message);

    messageInput.value = "";  // Clear the message input field


}

function displayChatMessage(message, sender, messageId, messageType) {
    const chatMessages = document.getElementById("chatMessages");
    const messageElement = document.createElement("div");
    messageElement.classList.add("message");

    let contentHtml;
    if (messageType === 'audio') {
        contentHtml.innerHTML = `
        <div>
        <strong>${sender}:</strong>
        <audio controls>
            <source src="${message}" type="audio/ogg">
            Your browser does not support the audio element.
        </audio>
    </div>
        `;
    } else {
        if (message.startsWith("data:image")) {
            // For image messages
            contentHtml = `
                <div>
                    <strong>${sender}:</strong>
                    <img src="${message}" style="max-width: 200px; max-height: 200px;">
                </div>`;
        } else {
            // For text messages
            contentHtml = `<div><strong>${sender}:</strong> ${message}</div>`;
        }
    }

    // Add the message content
    messageElement.innerHTML = contentHtml;

    // Create and append the delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("delete-button");
    deleteButton.setAttribute("data-message-id", messageId); // Use data attributes to associate the button with the message id
    deleteButton.onclick = function () {
        deleteMessage(messageId); // Implement this function to handle message deletion
    };

    messageElement.appendChild(deleteButton);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to the latest message
}

function deleteMessage(messageId) {
    // Implement the logic to delete the message from the UI and backend
    console.log("Deleting message with ID:", messageId);
    // Here you would typically make an API call to your backend to delete the message
}


function sendFile() {

    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            const base64Data = e.target.result;
            callSocket.send(JSON.stringify({
                type: 'chat_message',
                data: {
                    message: base64Data,
                    sender: myName,
                    receiver: receiver,
                    fileType: 'image' // Additional data to indicate the type of file
                }
            }));
        };

        reader.readAsDataURL(file); // Converts the file to Base64
    }
}

// Function for the receiver to decline the call
function declineCall() {
    resetCallUI();
    const message = JSON.stringify({
        type: 'decline_call',
        data: { from: myName, to: otherUser }
    });
    callSocket.send(message);

    document.getElementById("answer").style.display = "none";
    connectSocket(myName, receiver);
}

// Function for the caller to end the call before it's answered
function endCallBeforeAnswer() {
    resetCallUI();
    const message = JSON.stringify({
        type: 'end_call',
        data: { from: myName, to: otherUser }
    });
    callSocket.send(message);

    document.getElementById("calling").style.display = "none";
    connectSocket(myName, receiver);
}

function resetCallUI() {
    const sound = document.getElementById('ringingSound');
    sound.pause();
    sound.currentTime = 0; // Reset sound playback to the start

    document.getElementById("declineCallButton").style.display = "none";
    document.getElementById("endCallButton").style.display = "none";
    document.getElementById("call").style.display = "block";
    // Hide other call-related UI elements as necessary
    // Reset any other UI components to their initial state

    document.getElementById("call").style.display = "block";
    document.getElementById("videos").style.display = "none"; // Assuming this is your videos container

    callInProgress = false;
}

// Example function to delete all messages - you'll need to implement this on the server side
function deleteAllMessages() {
    const messageData = {
        type: 'delete_all_messages',
        data: {
            sender: myName,
            receiver: receiver
        }
    };

    callSocket.send(JSON.stringify(messageData));

    setTimeout(function () {
        window.location.reload();
    }, 500);

}


let mediaRecorder;
let audioChunks = [];

document.getElementById("startRecording").onclick = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            document.getElementById("stopRecording").disabled = false;
        });
};

document.getElementById("stopRecording").onclick = () => {
    mediaRecorder.stop();
    document.getElementById("stopRecording").disabled = true;

    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
            const base64AudioMessage = reader.result;

            // Send the Base64 audio message via WebSocket
            callSocket.send(JSON.stringify({
                type: 'chat_message',
                data: {
                    message: base64AudioMessage,
                    sender: myName,
                    receiver: receiver,
                    fileType: 'audio'
                }
            }));
        };
    };
};


let mediaCallRecorder;
let recordedChunks = [];
let callStartTimestamp;
document.getElementById('startCallRecording').addEventListener('click', () => {
    const tracks = [...peerConnection.getSenders(), ...peerConnection.getReceivers()]
        .map(sender => sender.track)
        .filter(track => track.kind === 'audio');
    const newStream = new MediaStream(tracks);
    mediaCallRecorder = new MediaRecorder(newStream, { mimeType: 'audio/webm' });

    mediaCallRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaCallRecorder.onstop = () => {
        // Combine chunks and convert to base64 or handle the Blob as needed
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        // Reset chunks for the next recording
        recordedChunks = [];
    };

    mediaCallRecorder.start();
    callStartTimestamp = new Date();
    document.getElementById('startCallRecording').disabled = true;
    document.getElementById('stopCallRecording').disabled = false;
});

document.getElementById('stopCallRecording').addEventListener('click', () => {
    mediaCallRecorder.stop();
    document.getElementById('startCallRecording').disabled = false;
    document.getElementById('stopCallRecording').disabled = true;

    mediaCallRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/webm' });
        recordedChunks = [];

        // Example: Convert Blob to Base64 (alternative: upload Blob directly)
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result;
            let callEndTimestamp = new Date();
            let callDuration = (callEndTimestamp - callStartTimestamp) / 1000; // Duration in seconds


            // Send base64 audio data to the server via WebSocket or HTTP
            callSocket.send(JSON.stringify({
                type: 'audio_message',
                data: base64data,
                caller: myName,
                receiver: receiver,
                otherUser: otherUser,
                duration: callDuration,
            }));
        };
    };
});

function updateUnreadMessagesCount(unreadCount) {
    console.log('jjj');

    const countElement = document.getElementById('unreadMessagesCount');
    if (countElement) {
        // document.getElementById('ringingSound').play();
        countElement.innerText = `(${unreadCount})`;
        countElement.style.display = unreadCount > 0 ? 'block' : 'none';

        setInterval(function () {
            refreshDivContent(); // Call the refresh function defined earlier
        }, 5000);
    }
}

function refreshDivContent() {
    document.getElementById('contentDiv').innerHTML = data;
}













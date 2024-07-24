/*
const socket = io();
let userId = "";
let username = "";
let currentGroupId = null;
let groupMessagePage = 1;
const groupMessageLimit = 10;

function showView(viewId) {
  hideAllViews();
  const viewElement = document.getElementById(viewId);
  if (viewElement) {
    viewElement.style.display = "block";
  } else {
    console.error(`Element with ID ${viewId} not found.`);
  }
}

function hideAllViews() {
  document.getElementById("registerContainer").style.display = "none";
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("chatContainer").style.display = "none";
  document.getElementById("groupChatContainer").style.display = "none";
}

document.getElementById("registerForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const regUserId = document.getElementById("regUserId").value;
  const regUsername = document.getElementById("regUsername").value;
  const regPassword = document.getElementById("regPassword").value;

  if (
    regUserId.trim() === "" ||
    regUsername.trim() === "" ||
    regPassword.trim() === ""
  ) {
    alert("Please fill in all required fields.");
    return;
  }

  fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userid: regUserId,
      username: regUsername,
      password: regPassword,
    }),
  })
    .then((response) => response.text())
    .then((data) => {
      alert(data);
    })
    .catch((error) => {
      console.error("Error registering user:", error);
      alert("Error registering user");
    });
});

document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const loginUsername = document.getElementById("loginUsername").value;
  const loginPassword = document.getElementById("loginPassword").value;

  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: loginUsername,
      password: loginPassword,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data.message);
      userId = data.userid;
      username = data.username;
      document.getElementById("currentUser").textContent = username;
      showView("chatContainer");
      socket.emit("joinRoom", { userId, username });
    })
    .catch((error) => {
      console.error("Error logging in:", error);
      alert("Invalid username or password");
    });
});

document.getElementById("createGroupBtn").addEventListener("click", () => {
  const groupName = prompt("Enter group name:");
  if (groupName) {
    fetch("/create-group", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ groupname: groupName }),
    })
      .then((response) => response.text())
      .then((data) => {
        alert(data);
        displayGroupNames(); // Refresh group list
      })
      .catch((error) => {
        console.error("Error creating group:", error);
        alert("Error creating group");
      });
  }
});

function displayGroupNames() {
  fetch("/group-names")
    .then((response) => response.json())
    .then((groupNames) => {
      const groupList = document.getElementById("groupList");
      groupList.innerHTML = "";
      groupNames.forEach((group) => {
        const groupItem = document.createElement("li");
        groupItem.textContent = `Group: ${group.groupname}`;
        groupItem.dataset.groupid = group.groupid;
        groupList.appendChild(groupItem);

        groupItem.addEventListener("click", () => {
          handleGroupSelection(group.groupid);
        });
      });
    })
    .catch((error) => {
      console.error("Error fetching group names:", error);
    });
}
displayGroupNames();

function updateGroupMembersUI(members) {
  const groupChatWith = document.getElementById("groupChatWith");
  groupChatWith.textContent = `Group Chat with: ${members
    .map((member) => member.username)
    .join(", ")}`;
}

document.getElementById("addUserToGroupBtn").addEventListener("click", () => {
  fetch("/users")
    .then((response) => response.json())
    .then((allUsers) => {
      const userListContainer = document.createElement("div");
      userListContainer.id = "userListContainer";
      userListContainer.classList.add("user-list-container");

      const existingContainer = document.getElementById("userListContainer");
      if (existingContainer) {
        existingContainer.remove();
      }

      document.body.appendChild(userListContainer);

      allUsers.forEach((user) => {
        const userItem = document.createElement("div");
        userItem.textContent = `User ID: ${user.userid}, Username: ${user.username}`;
        userItem.dataset.userid = user.userid;
        userItem.classList.add("user-item");

        userItem.addEventListener("click", () => {
          addUserToGroup(user.userid);
          userListContainer.remove();
        });

        userListContainer.appendChild(userItem);
      });
    })
    .catch((error) => {
      console.error("Error fetching all users:", error);
      alert("Error fetching all users");
    });
});

function addUserToGroup(userId) {
  if (currentGroupId) {
    fetch("/add-to-group", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ groupid: currentGroupId, userid: userId }),
    })
      .then((response) => response.text())
      .then((data) => {
        alert(data);
        fetchGroupMembers(currentGroupId);
      })
      .catch((error) => {
        console.error("Error adding user to group:", error);
        alert("Error adding user to group");
      });
  } else {
    console.error("No current group selected");
    alert("No current group selected");
  }
}

function fetchGroupMembers(groupId) {
  fetch(`/group-members?currentGroupId=${groupId}`)
    .then((response) => response.json())
    .then((members) => {
      console.log("Group Members:", members);
      updateGroupMembersUI(members);
    })
    .catch((error) => {
      console.error("Error fetching group members:", error);
    });
}

function handleGroupSelection(groupId) {
  currentGroupId = groupId;
  showView("groupChatContainer");
  fetchGroupMessages(groupId, true);
  fetchGroupMembers(groupId);
}

document
  .getElementById("groupMessageForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const messageInput = document.getElementById("groupMessageInput");
    const messageText = messageInput.value;

    if (messageText.trim()) {
      sendGroupMessage(currentGroupId, messageText);
      messageInput.value = "";
      messageInput.focus();
    }
  });

function displayGroupMessage(messageData) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", "received");
  messageElement.innerHTML = `
    <div class="message-user">${messageData.user}</div>
    <div class="message-text">${messageData.message}</div>
    <div class="message-timestamp">${new Date(
      messageData.timestamp
    ).toLocaleString()}</div>
  `;
  document.getElementById("groupMessages").appendChild(messageElement);
  scrollToBottom("groupMessages");
}

function sendGroupMessage(currentGroupId, messageText) {
  const messageData = {
    user: username, // User's username
    groupid: currentGroupId,
    message: messageText,
    timestamp: new Date().toISOString(),
  };
  console.log("sending messages ....", messageData);

  // Emit the message to the server
  socket.emit("group-message", messageData);
}

function createMessageElement(messageData, isSender) {
  const { user, message, timestamp } = messageData;
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", isSender ? "sent" : "received");

  // Format the timestamp as needed, e.g., "HH:MM:SS"
  const formattedTimestamp = new Date(timestamp).toLocaleTimeString();

  messageElement.innerHTML = `
    <div class="message-user">${user}</div>
    <div class="message-text">${message}</div>
    <div class="message-timestamp">${formattedTimestamp}</div>
  `;

  return messageElement;
}

function scrollToBottom(containerId) {
  const container = document.getElementById(containerId);
  container.scrollTop = container.scrollHeight;
}

let isLoadingMessages = false;
let isInitialLoad = true;

function fetchGroupMessages(groupId) {
  if (isLoadingMessages) return; // Prevent concurrent fetches
  isLoadingMessages = true;

  fetch(
    `/group-messages?groupid=${groupId}&page=${groupMessagePage}&limit=${groupMessageLimit}`
  )
    .then((response) => response.json())
    .then((data) => {
      console.log("Fetched messages:", data);
      if (data.messages) {
        const groupMessagesContainer = document.getElementById("groupMessages");

        if (isInitialLoad) {
          groupMessagesContainer.innerHTML = "";
          isInitialLoad = false;
        }
        // Append messages at the top
        const fragment = document.createDocumentFragment();
        data.messages.forEach((message) => {
          const messageElement = createMessageElement(message, false);
          fragment.prepend(messageElement);
        });
        groupMessagesContainer.prepend(fragment);
        // Adjust scroll position to simulate loading more data
        groupMessagesContainer.scrollTop = groupMessagesContainer.scrollHeight;
        groupMessagesContainer.clientHeight;

        // Check if more pages are available
        if (data.pagination.currentPage < data.pagination.totalPages) {
          groupMessagePage++;
        }
      }
      isLoadingMessages = false;
    })
    .catch((error) => {
      console.error("Error fetching group messages:", error);
      isLoadingMessages = false;
    });
}

// Infinite scrolling
const groupMessagesContainer = document.getElementById("groupMessages");
groupMessagesContainer.addEventListener("scroll", () => {
  if (groupMessagesContainer.scrollTop === 0 && !isLoadingMessages) {
    if (groupMessagePage >= 1) {
      fetchGroupMessages(currentGroupId);
    }
  }
});

socket.on("group-message", (messageData) => {
  if (messageData.groupid === currentGroupId) {
    console.log("Received message:", messageData); // Debug log
    displayGroupMessage(messageData);
  }
});

showView("registerContainer");
*/

// const socket = io();
// let userId = "";
// let username = "";
// let currentGroupId = null;
// let groupMessagePage = 1;
// const groupMessageLimit = 10;

// function showView(viewId) {
//   hideAllViews();
//   const viewElement = document.getElementById(viewId);
//   if (viewElement) {
//     viewElement.style.display = "block";
//   } else {
//     console.error(`Element with ID ${viewId} not found.`);
//   }
// }

// function hideAllViews() {
//   document.getElementById("registerContainer").style.display = "none";
//   document.getElementById("loginContainer").style.display = "none";
//   document.getElementById("chatContainer").style.display = "none";
//   document.getElementById("groupChatContainer").style.display = "none";
// }

// document.getElementById("registerForm").addEventListener("submit", (event) => {
//   event.preventDefault();
//   const regUserId = document.getElementById("regUserId").value;
//   const regUsername = document.getElementById("regUsername").value;
//   const regPassword = document.getElementById("regPassword").value;

//   if (
//     regUserId.trim() === "" ||
//     regUsername.trim() === "" ||
//     regPassword.trim() === ""
//   ) {
//     alert("Please fill in all required fields.");
//     return;
//   }

//   fetch("/register", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       userid: regUserId,
//       username: regUsername,
//       password: regPassword,
//     }),
//   })
//     .then((response) => response.text())
//     .then((data) => {
//       alert(data);
//     })
//     .catch((error) => {
//       console.error("Error registering user:", error);
//       alert("Error registering user");
//     });
// });

// document.getElementById("loginForm").addEventListener("submit", (event) => {
//   event.preventDefault();
//   const loginUsername = document.getElementById("loginUsername").value;
//   const loginPassword = document.getElementById("loginPassword").value;

//   fetch("/login", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       username: loginUsername,
//       password: loginPassword,
//     }),
//   })
//     .then((response) => response.json())
//     .then((data) => {
//       alert(data.message);
//       userId = data.userid;
//       username = data.username;
//       document.getElementById("currentUser").textContent = username;
//       showView("chatContainer");
//       socket.emit("joinRoom", { userId, username });
//     })
//     .catch((error) => {
//       console.error("Error logging in:", error);
//       alert("Invalid username or password");
//     });
// });

// document.getElementById("createGroupBtn").addEventListener("click", () => {
//   const groupName = prompt("Enter group name:");
//   if (groupName) {
//     fetch("/create-group", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ groupname: groupName }),
//     })
//       .then((response) => response.text())
//       .then((data) => {
//         alert(data);
//         displayGroupNames(); // Refresh group list
//         socket.emit("addUserToGroup", { groupName, userId });
//       })
//       .catch((error) => {
//         console.error("Error creating group:", error);
//         alert("Error creating group");
//       });
//   }
// });

// function displayGroupNames(groups) {
//   if (!groups || !Array.isArray(groups)) {
//     console.error("Invalid groups data:", groups);
//     return;
//   }

//   const groupList = document.getElementById("groupList");
//   groupList.innerHTML = "";
//   groups.forEach((group) => {
//     const groupItem = document.createElement("li");
//     groupItem.textContent = `Group: ${group.groupname}`;
//     groupItem.dataset.groupid = group.groupid;
//     groupList.appendChild(groupItem);

//     groupItem.addEventListener("click", () => {
//       handleGroupSelection(group.groupid);
//     });
//   });
// }

// // Handle the 'user-groups' event from the server
// socket.on("user-groups", (groups) => {
//   console.log("Received groups data:", groups); // Log data for debugging
//   displayGroupNames(groups);
// });

// function updateGroupMembersUI(members) {
//   const groupChatWith = document.getElementById("groupChatWith");
//   groupChatWith.textContent = `Group  Members  = ${members
//     .map((member) => member.username)
//     .join(", ")}`;
// }

// document.getElementById("addUserToGroupBtn").addEventListener("click", () => {
//   fetch("/users")
//     .then((response) => response.json())
//     .then((allUsers) => {
//       const userListContainer = document.createElement("div");
//       userListContainer.id = "userListContainer";
//       userListContainer.classList.add("user-list-container");

//       const existingContainer = document.getElementById("userListContainer");
//       if (existingContainer) {
//         existingContainer.remove();
//       }

//       document.body.appendChild(userListContainer);

//       allUsers.forEach((user) => {
//         const userItem = document.createElement("div");
//         userItem.textContent = `User ID: ${user.userid}, Username: ${user.username}`;
//         userItem.dataset.userid = user.userid;
//         userItem.classList.add("user-item");

//         userItem.addEventListener("click", () => {
//           addUserToGroup(user.userid);
//           userListContainer.remove();
//         });

//         userListContainer.appendChild(userItem);
//       });
//     })
//     .catch((error) => {
//       console.error("Error fetching all users:", error);
//       alert("Error fetching all users");
//     });
// });

// function addUserToGroup(userId) {
//   if (currentGroupId) {
//     fetch("/add-to-group", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ groupid: currentGroupId, userid: userId }),
//     })
//       .then((response) => response.text())
//       .then((data) => {
//         alert(data);
//         fetchGroupMembers(currentGroupId);
//       })
//       .catch((error) => {
//         console.error("Error adding user to group:", error);
//         alert("Error adding user to group");
//       });
//   } else {
//     console.error("No current group selected");
//     alert("No current group selected");
//   }
// }

// function fetchGroupMembers(groupId) {
//   fetch(`/group-members?currentGroupId=${groupId}`)
//     .then((response) => response.json())
//     .then((members) => {
//       console.log("Group Members:", members);
//       updateGroupMembersUI(members);
//     })
//     .catch((error) => {
//       console.error("Error fetching group members:", error);
//     });
// }

// // function handleGroupSelection(groupId) {
// //   currentGroupId = groupId;
// //   showView("groupChatContainer");
// //   fetchGroupMessages(groupId, true);
// //   fetchGroupMembers(groupId);
// // }
// function handleGroupSelection(groupId) {
//   currentGroupId = groupId;
//   showView("groupChatContainer");
//   fetchGroupMessages(groupId, true);
//   fetchGroupMembers(groupId);
// }

// document
//   .getElementById("groupMessageForm")
//   .addEventListener("submit", function (e) {
//     e.preventDefault();
//     const messageInput = document.getElementById("groupMessageInput");
//     const messageText = messageInput.value;

//     if (messageText.trim()) {
//       sendGroupMessage(currentGroupId, messageText);
//       messageInput.value = "";
//       messageInput.focus();
//     }
//   });

// function displayGroupMessage(messageData) {
//   // Check if the message already exists in the chat container
//   const existingMessages = document.querySelectorAll(".message");
//   const isDuplicate = Array.from(existingMessages).some(
//     (msg) =>
//       msg.querySelector(".message-timestamp").textContent ===
//       new Date(messageData.timestamp).toLocaleTimeString()
//   );

//   if (isDuplicate) {
//     return; // Avoid displaying duplicate messages
//   }

//   const messageElement = document.createElement("div");
//   messageElement.classList.add("message", "received");
//   messageElement.innerHTML = `
//     <div class="message-user">${messageData.user}</div>
//     <div class="message-text">${messageData.message}</div>
//     <div class="message-timestamp">${new Date(
//       messageData.timestamp
//     ).toLocaleString()}</div>
//   `;
//   document.getElementById("groupMessages").appendChild(messageElement);
//   scrollToBottom("groupMessages");
// }

// function sendGroupMessage(currentGroupId, messageText) {
//   const messageData = {
//     user: username, // User's username
//     groupid: currentGroupId,
//     message: messageText,
//     timestamp: new Date().toISOString(),
//   };
//   console.log("sending messages ....", messageData);

//   // Emit the message to the server
//   socket.emit("group-message", messageData);
// }

// function createMessageElement(messageData, isSender) {
//   const { user, message, timestamp } = messageData;
//   const messageElement = document.createElement("div");
//   messageElement.classList.add("message", isSender ? "sent" : "received");

//   // Format the timestamp as needed
//   const formattedTimestamp = new Date(timestamp).toLocaleTimeString();

//   messageElement.innerHTML = `
//     <div class="message-user">${user}</div>
//     <div class="message-text">${message}</div>
//     <div class="message-timestamp">${formattedTimestamp}</div>
//   `;

//   return messageElement;
// }

// function scrollToBottom(containerId) {
//   const container = document.getElementById(containerId);
//   container.scrollTop = container.scrollHeight;
// }

// let isLoadingMessages = false;
// let isInitialLoad = true;
// let lastFetchedPage = 0;

// function fetchGroupMessages(groupId, isInitialLoad = false) {
//   if (isLoadingMessages) return; // Prevent concurrent fetches
//   isLoadingMessages = true;

//   // Only fetch if we have not fetched all pages
//   if (lastFetchedPage === groupMessagePage) {
//     isLoadingMessages = false;
//     return;
//   }

//   fetch(
//     `/group-messages?groupid=${groupId}&page=${groupMessagePage}&limit=${groupMessageLimit}`
//   )
//     .then((response) => response.json())
//     .then((data) => {
//       console.log("Fetched messages:", data);
//       if (data.messages) {
//         const groupMessagesContainer = document.getElementById("groupMessages");

//         if (isInitialLoad) {
//           groupMessagesContainer.innerHTML = ""; // Clear existing messages on initial load
//         }

//         // Append messages at the top
//         const fragment = document.createDocumentFragment();
//         data.messages.forEach((message) => {
//           const messageElement = createMessageElement(message, false);
//           fragment.prepend(messageElement);
//         });
//         groupMessagesContainer.prepend(fragment);

//         // Scroll to the position where the older messages were fetched
//         groupMessagesContainer.scrollTop = groupMessagesContainer.scrollHeight;

//         // Update last fetched page
//         lastFetchedPage = data.pagination.currentPage;

//         // Check if more pages are available
//         if (data.pagination.currentPage < data.pagination.totalPages) {
//           groupMessagePage++;
//         } else {
//           // No more pages to load
//           lastFetchedPage = groupMessagePage;
//         }
//       }
//       isLoadingMessages = false;
//     })
//     .catch((error) => {
//       console.error("Error fetching group messages:", error);
//       isLoadingMessages = false;
//     });
// }

// const groupMessagesContainer = document.getElementById("groupMessages");

// groupMessagesContainer.addEventListener("scroll", () => {
//   if (groupMessagesContainer.scrollTop === 0 && !isLoadingMessages) {
//     fetchGroupMessages(currentGroupId);
//   }
// });

// socket.on("group-message", (messageData) => {
//   if (messageData.groupid === currentGroupId) {
//     console.log("Received message:", messageData); // Debug log
//     displayGroupMessage(messageData);
//   }
// });

// showView("registerContainer");

const socket = io();
let userId = "";
let username = "";
let currentGroupId = null;
let groupMessagePage = 1;
const groupMessageLimit = 10;

function showView(viewId) {
  hideAllViews();
  const viewElement = document.getElementById(viewId);
  if (viewElement) {
    viewElement.style.display = "block";
  } else {
    console.error(`Element with ID ${viewId} not found.`);
  }
}

function hideAllViews() {
  document.getElementById("registerContainer").style.display = "none";
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("chatContainer").style.display = "none";
  document.getElementById("groupChatContainer").style.display = "none";
}

document.getElementById("registerForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const regUserId = document.getElementById("regUserId").value;
  const regUsername = document.getElementById("regUsername").value;
  const regPassword = document.getElementById("regPassword").value;

  if (
    regUserId.trim() === "" ||
    regUsername.trim() === "" ||
    regPassword.trim() === ""
  ) {
    alert("Please fill in all required fields.");
    return;
  }

  fetch("/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userid: regUserId,
      username: regUsername,
      password: regPassword,
    }),
  })
    .then((response) => response.text())
    .then((data) => {
      alert(data);
    })
    .catch((error) => {
      console.error("Error registering user:", error);
      alert("Error registering user");
    });
});

document.getElementById("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const loginUsername = document.getElementById("loginUsername").value;
  const loginPassword = document.getElementById("loginPassword").value;

  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: loginUsername,
      password: loginPassword,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data.message);
      userId = data.userid;
      username = data.username;
      document.getElementById("currentUser").textContent = username;
      showView("chatContainer");
      socket.emit("joinRoom", { userId, username });
    })
    .catch((error) => {
      console.error("Error logging in:", error);
      alert("Invalid username or password");
    });
});

document.getElementById("createGroupBtn").addEventListener("click", () => {
  const groupName = prompt("Enter group name:");
  if (groupName) {
    fetch("/create-group", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ groupname: groupName }),
    })
      .then((response) => response.text())
      .then((data) => {
        alert(data);
        displayGroupNames(); // Refresh group list
        socket.emit("addUserToGroup", { groupName, userId });
      })
      .catch((error) => {
        console.error("Error creating group:", error);
        alert("Error creating group");
      });
  }
});

function displayGroupNames(groups) {
  if (!groups || !Array.isArray(groups)) {
    console.error("Invalid groups data:", groups);
    return;
  }

  const groupList = document.getElementById("groupList");
  groupList.innerHTML = "";
  groups.forEach((group) => {
    const groupItem = document.createElement("li");
    groupItem.textContent = `Group: ${group.groupname}`;
    groupItem.dataset.groupid = group.groupid;
    groupList.appendChild(groupItem);

    groupItem.addEventListener("click", () => {
      handleGroupSelection(group.groupid);
    });
  });
}

// Handle the 'user-groups' event from the server
socket.on("user-groups", (groups) => {
  console.log("Received groups data:", groups);
  displayGroupNames(groups);
});

function updateGroupMembersUI(members) {
  const groupChatWith = document.getElementById("groupChatWith");
  groupChatWith.textContent = `Group  Members  = ${members
    .map((member) => member.username)
    .join(", ")}`;
}

document.getElementById("addUserToGroupBtn").addEventListener("click", () => {
  fetch("/users")
    .then((response) => response.json())
    .then((allUsers) => {
      const userListContainer = document.createElement("div");
      userListContainer.id = "userListContainer";
      userListContainer.classList.add("user-list-container");

      const existingContainer = document.getElementById("userListContainer");
      if (existingContainer) {
        existingContainer.remove();
      }

      document.body.appendChild(userListContainer);

      allUsers.forEach((user) => {
        const userItem = document.createElement("div");
        userItem.textContent = `User ID: ${user.userid}, Username: ${user.username}`;
        userItem.dataset.userid = user.userid;
        userItem.classList.add("user-item");

        userItem.addEventListener("click", () => {
          addUserToGroup(user.userid);
          userListContainer.remove();
        });

        userListContainer.appendChild(userItem);
      });
    })
    .catch((error) => {
      console.error("Error fetching all users:", error);
      alert("Error fetching all users");
    });
});

// Event listener for back to chat button in private chat view
document.getElementById("backToChatBtn").addEventListener("click", () => {
  showView("chatContainer");
  currentRecipient = null;
  document.getElementById("groupMessages").innerHTML = "";
  groupMessagePage = 1; // Reset pagination to first page
});

function addUserToGroup(userId) {
  if (currentGroupId) {
    fetch("/add-to-group", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ groupid: currentGroupId, userid: userId }),
    })
      .then((response) => response.text())
      .then((data) => {
        alert(data);
        fetchGroupMembers(currentGroupId);
      })
      .catch((error) => {
        console.error("Error adding user to group:", error);
        alert("Error adding user to group");
      });
  } else {
    console.error("No current group selected");
    alert("No current group selected");
  }
}

function fetchGroupMembers(groupId) {
  fetch(`/group-members?currentGroupId=${groupId}`)
    .then((response) => response.json())
    .then((members) => {
      console.log("Group Members:", members);
      updateGroupMembersUI(members);
    })
    .catch((error) => {
      console.error("Error fetching group members:", error);
    });
}

function handleGroupSelection(groupId) {
  currentGroupId = groupId;
  showView("groupChatContainer");
  fetchGroupMessages(groupId, true);
  fetchGroupMembers(groupId);
}

document
  .getElementById("groupMessageForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const messageInput = document.getElementById("groupMessageInput");
    const messageText = messageInput.value;

    if (messageText.trim()) {
      sendGroupMessage(currentGroupId, messageText);
      messageInput.value = "";
      messageInput.focus();
    }
  });

function displayGroupMessage(messageData) {
  // Check if the message already exists in the chat container
  const existingMessages = document.querySelectorAll(".message");
  const isDuplicate = Array.from(existingMessages).some(
    (msg) =>
      msg.querySelector(".message-timestamp").textContent ===
      new Date(messageData.timestamp).toLocaleTimeString()
  );

  if (isDuplicate) {
    return; // Avoid displaying duplicate messages
  }

  const messageElement = document.createElement("div");
  messageElement.classList.add("message", "received");
  messageElement.innerHTML = `
    <div class="message-user">${messageData.user}</div>
    <div class="message-text">${messageData.message}</div>
    <div class="message-timestamp">${new Date(
      messageData.timestamp
    ).toLocaleString()}</div>
  `;
  document.getElementById("groupMessages").appendChild(messageElement);
  scrollToBottom("groupMessages");
}

function sendGroupMessage(currentGroupId, messageText) {
  const messageData = {
    user: username, // User's username
    groupid: currentGroupId,
    message: messageText,
    timestamp: new Date().toISOString(),
  };
  console.log("sending messages ....", messageData);

  // Emit the message to the server
  socket.emit("group-message", messageData);
}

function createMessageElement(messageData, isSender) {
  const { user, message, timestamp } = messageData;
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", isSender ? "sent" : "received");

  // Format the timestamp as needed
  const formattedTimestamp = new Date(timestamp).toLocaleTimeString();

  messageElement.innerHTML = `
    <div class="message-user">${user}</div>
    <div class="message-text">${message}</div>
    <div class="message-timestamp">${formattedTimestamp}</div>
  `;

  return messageElement;
}

function scrollToBottom(containerId) {
  const container = document.getElementById(containerId);
  container.scrollTop = container.scrollHeight;
}

let isLoadingMessages = false;
let isInitialLoad = true;
let lastFetchedPage = 0;

function fetchGroupMessages(groupId, isInitialLoad = false) {
  if (isLoadingMessages) return; // Prevent concurrent fetches
  isLoadingMessages = true;

  // Only fetch if we have not fetched all pages
  if (lastFetchedPage === groupMessagePage) {
    isLoadingMessages = false;
    return;
  }

  fetch(
    `/group-messages?groupid=${groupId}&page=${groupMessagePage}&limit=${groupMessageLimit}`
  )
    .then((response) => response.json())
    .then((data) => {
      console.log("Fetched messages:", data);
      if (data.messages) {
        const groupMessagesContainer = document.getElementById("groupMessages");

        if (isInitialLoad) {
          groupMessagesContainer.innerHTML = ""; // Clear existing messages on initial load
        }

        // Append messages at the top
        const fragment = document.createDocumentFragment();
        data.messages.forEach((message) => {
          const messageElement = createMessageElement(message, false);
          fragment.prepend(messageElement);
        });
        groupMessagesContainer.prepend(fragment);

        // Scroll to the position where the older messages were fetched
        groupMessagesContainer.scrollTop = groupMessagesContainer.scrollHeight;

        // Update last fetched page
        lastFetchedPage = data.pagination.currentPage;

        // Check if more pages are available
        if (data.pagination.currentPage < data.pagination.totalPages) {
          groupMessagePage++;
        } else {
          // No more pages to load
          lastFetchedPage = groupMessagePage;
        }
      }
      isLoadingMessages = false;
    })
    .catch((error) => {
      console.error("Error fetching group messages:", error);
      isLoadingMessages = false;
    });
}

const groupMessagesContainer = document.getElementById("groupMessages");

groupMessagesContainer.addEventListener("scroll", () => {
  if (groupMessagesContainer.scrollTop === 0 && !isLoadingMessages) {
    fetchGroupMessages(currentGroupId);
  }
});

socket.on("group-message", (messageData) => {
  if (messageData.groupid === currentGroupId) {
    console.log("Received message:", messageData); // Debug log
    displayGroupMessage(messageData);
  }
});

showView("registerContainer");

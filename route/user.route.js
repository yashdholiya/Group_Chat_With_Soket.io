// clint side jsvs svript

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
          currentGroupId = group.groupid;
          showView("groupChatContainer");
          fetchGroupMessages(currentGroupId, true);
          fetchGroupMembers(currentGroupId);
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
  fetchGroupMessages(currentGroupId, true);
  fetchGroupMembers(currentGroupId);
}

document.querySelector("#groupList").addEventListener("click", (event) => {
  const groupId = event.target.dataset.groupid;
  if (groupId) {
    handleGroupSelection(groupId);
  }
});

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

function displayIncomingMessage(messageData) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", "received");
  messageElement.innerHTML = `
      <div class="message-user">${messageData.user}</div>
      <div class="message-text">${messageData.message}</div>
      <div class="message-timestamp">${new Date(
        messageData.timestamp
      ).toLocaleTimeString()}</div>`;
  document.getElementById("groupMessages").appendChild(messageElement);
  messageElement.scrollTop = messageElement.scrollHeight;
}

function sendGroupMessage(currentGroupId, messageText) {
  const messageData = {
    user: username, // User's username
    groupid: currentGroupId,
    message: messageText,
    timestamp: new Date().toISOString(),
  };
  console.log("hello ...", username);
  console.log("sending messages ....", messageData);

  // Emit the message to the server
  socket.emit("group-message", messageData);
}

function createMessageElement(messageData) {
  const { user, message, timestamp } = messageData;
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.innerHTML = `<strong>${user}:</strong> ${message} <small>${new Date(
    timestamp
  ).toLocaleString()}</small>`;
  return messageElement;
}

function appendMessages(messages, clear = false) {
  const groupMessages = document.getElementById("groupMessages");
  if (clear) {
    groupMessages.innerHTML = "";
  }
  messages.forEach((messageData) => {
    const messageElement = createMessageElement(messageData);
    groupMessages.appendChild(messageElement);
  });
}

function fetchGroupMessages(groupId, clear = false) {
  fetch(
    `/group-messages?groupId=${groupId}&page=${groupMessagePage}&limit=${groupMessageLimit}`
  )
    .then((response) => response.json())
    .then((messages) => {
      appendMessages(messages, clear);
      if (messages.length > 0) {
        groupMessagePage++;
      }
    })
    .catch((error) => {
      console.error("Error fetching group messages:", error);
    });
}

socket.on("group-message", (messageData) => {
  console.log("Received group message:", messageData);
  displayIncomingMessage(messageData);
});

socket.on("groupMessage", (message) => {
  console.log("Received group message:", message);
  displayIncomingMessage(message);
});

// Assuming you have the groupid, sender (username), and message ready
function joinGroup(groupid) {
  socket.emit("joinGroup", groupid);
}

function sendMessage(groupid, sender, message) {
  socket.emit("sendMessage", { groupid, sender, message });
}

// Listen for incoming messages
socket.on("receiveMessage", (data) => {
  const { sender, message, created_at } = data;
  // Display the message in the chat UI
  console.log(`Message from ${sender}: ${message} at ${created_at}`);
  // Here you can update the DOM to show the message
});

showView("registerContainer");

// server code =

const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const bcrypt = require("bcrypt");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "chat_app",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/register", (req, res) => {
  const { userid, username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const query =
    "INSERT INTO users (userid, username, password) VALUES (?, ?, ?)";
  db.query(query, [userid, username, hashedPassword], (err) => {
    if (err) {
      console.error("Error registering user:", err);
      res.status(500).send("Error registering user");
      return;
    }
    res.send("User registered successfully");
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], (err, results) => {
    if (err) {
      console.error("Error logging in:", err);
      res.status(500).send("Error logging in");
      return;
    }

    if (results.length > 0) {
      const user = results[0];

      // Compare the hashed password
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          console.error("Error comparing passwords:", err);
          res.status(500).send("Error logging in");
          return;
        }

        if (result) {
          res.json({
            message: "Login successful",
            userid: user.userid,
            username: user.username,
          });
        } else {
          res.status(401).send("Invalid username or password");
        }
      });
    } else {
      res.status(401).send("Invalid username or password");
    }
  });
});

app.post("/create-group", (req, res) => {
  const { groupname } = req.body;
  const query = "INSERT INTO groupss (groupname) VALUES (?)";
  db.query(query, [groupname], (err) => {
    if (err) {
      console.error("Error creating group:", err);
      res.status(500).send("Error creating group");
      return;
    }
    res.send("Group created successfully");
  });
});

app.get("/group-names", (req, res) => {
  const query = "SELECT * FROM groupss";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching group names:", err);
      res.status(500).send("Error fetching group names");
      return;
    }
    res.json(results);
  });
});

app.post("/add-to-group", (req, res) => {
  const { groupid, userid } = req.body;
  const query = "INSERT INTO group_members (groupid, userid) VALUES (?, ?)";
  db.query(query, [groupid, userid], (err) => {
    if (err) {
      console.error("Error adding user to group:", err);
      res.status(500).send("Error adding user to group");
      return;
    }
    res.send("User added to group successfully");
  });
});

app.get("/group-members", (req, res) => {
  const { currentGroupId } = req.query;
  const query = `
    SELECT u.userid, u.username
    FROM group_members gm
    JOIN users u ON gm.userid = u.userid
    WHERE gm.groupid = ?
  `;
  db.query(query, [currentGroupId], (err, results) => {
    if (err) {
      console.error("Error fetching group members:", err);
      res.status(500).send("Error fetching group members");
      return;
    }
    res.json(results);
  });
});

app.get("/users", (req, res) => {
  const query = "SELECT userid, username FROM users";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching all users:", err);
      res.status(500).send("Error fetching all users");
      return;
    }
    res.json(results);
  });
});

app.get("/group-messages", (req, res) => {
  const { groupId, page, limit } = req.query;
  const offset = (page - 1) * limit;
  const query = `
   SELECT gm.*, u.username AS user
    FROM group_messages gm
    JOIN users u ON gm.sender = u.username
    WHERE gm.groupid = ?
    ORDER BY gm.created_at ASC
    LIMIT 10 OFFSET 0
  `;
  db.query(query, [groupId, parseInt(limit), offset], (err, results) => {
    if (err) {
      console.error("Error fetching group messages:", err);
      res.status(500).send("Error fetching group messages");
      return;
    }
    res.json(results);
  });
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinRoom", ({ userId, username }) => {
    socket.userId = userId;
    socket.username = username;
    console.log(`User ${username} joined with ID ${userId}`);
  });

  socket.on("group-message", (messageData) => {
    const { user, groupid, message, timestamp } = messageData;
    const query = `
    INSERT INTO group_messages (groupid, sender, message, created_at)
    VALUES (?, ?, ?, ?)
  `;
    db.query(query, [groupid, user, message, timestamp], (err) => {
      if (err) {
        console.error("Error saving group message:", err);
        return;
      }

      // Broadcast the message to all clients in the group
      io.emit("group-message", messageData);
      console.log("group message inserted successfully");
    });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start server
// const PORT = 2379;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

//////////////////////////////////////////////////////////////////send and resive perfect /////////////////////////////////////////////////////

// const socket = io();
// let userId = "";
// let username = "";
// let currentGroupId = null;
// let groupMessagePage = 1;
// const groupMessageLimit = 10;
let currentRecipient = null;

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
          currentGroupId = group.groupid;
          showView("groupChatContainer");
          fetchGroupMessages(currentGroupId, true);
          fetchGroupMembers(currentGroupId);
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
  fetchGroupMessages(currentGroupId, true);
  fetchGroupMembers(currentGroupId);
}

document.querySelector("#groupList").addEventListener("click", (event) => {
  const groupId = event.target.dataset.groupid;
  if (groupId) {
    handleGroupSelection(groupId);
  }
});

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

function displayIncomingMessage(messageData) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", "received");
  messageElement.innerHTML = `
      <div class="message-user">${messageData.user}</div>
      <div class="message-text">${messageData.message}</div>
      <div class="message-timestamp">${new Date(
        messageData.timestamp
      ).toLocaleTimeString()}</div>`;
  document.getElementById("groupMessages").appendChild(messageElement);
  messageElement.scrollTop = messageElement.scrollHeight;
}

function sendGroupMessage(currentGroupId, messageText) {
  const messageData = {
    user: username, // User's username
    groupid: currentGroupId,
    message: messageText,
    timestamp: new Date().toISOString(),
  };
  console.log("hello ...", username);
  console.log("sending messages ....", messageData);

  // Emit the message to the server
  socket.emit("group-message", messageData);
}

function createMessageElement(messageData) {
  const { user, message, timestamp } = messageData;
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.innerHTML = `<strong>${user}:</strong> ${message} <small>${new Date(
    timestamp
  ).toLocaleString()}</small>`;
  return messageElement;
}

function appendMessages(messages, clear = false) {
  const groupMessages = document.getElementById("groupMessages");
  if (clear) {
    groupMessages.innerHTML = "";
  }
  messages.forEach((messageData) => {
    const messageElement = createMessageElement(messageData);
    groupMessages.appendChild(messageElement);
  });
  groupMessages.scrollTop = groupMessages.scrollHeight;
}

// function fetchGroupMessages(groupId, clear = false) {
//   // console.log("hello ....", groupId);
//   fetch(
//     `/group-messages?groupid=${groupId}&page=${groupMessagePage}&limit=${groupMessageLimit}`
//   )
//     .then((response) => response.json())
//     .then((data) => {
//       const { messages, pagination } = data;
//       appendMessages(messages, clear);
//       if (pagination.currentPage < pagination.totalPages) {
//         const loadMoreBtn = document.getElementById("loadMoreMessagesBtn");
//         if (!loadMoreBtn) {
//           const button = document.createElement("button");
//           button.id = "loadMoreMessagesBtn";
//           button.textContent = "Load More Messages";
//           button.addEventListener("click", () => {
//             groupMessagePage++;
//             fetchGroupMessages(groupId);
//           });
//           document.getElementById("groupChatContainer").appendChild(button);
//         }
//       }
//     })
//     .catch((error) => {
//       console.error("Error fetching group messages:", error);
//     });
// }
function fetchGroupMessages(groupId, clear = false) {
  fetch(
    `/group-messages?groupid=${groupId}&page=${groupMessagePage}&limit=${groupMessageLimit}`
  )
    .then((response) => response.json())
    .then((data) => {
      const { messages, pagination } = data;
      appendMessages(messages, clear);
      if (pagination.currentPage < pagination.totalPages) {
        const loadMoreBtn = document.getElementById("loadMoreMessagesBtn");
        if (!loadMoreBtn) {
          const button = document.createElement("button");
          button.id = "loadMoreMessagesBtn";
          button.textContent = "Load More Messages";
          button.addEventListener("click", () => {
            groupMessagePage++;
            fetchGroupMessages(groupId);
          });
          document.getElementById("groupChatContainer").appendChild(button);
        }
      }
    })
    .catch((error) => {
      console.error("Error fetching group messages:", error);
    });
}

socket.on("group-message", (messageData) => {
  if (currentGroupId === messageData.groupid) {
    displayIncomingMessage(messageData);
  }
});

showView("registerContainer");
/////

const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const bcrypt = require("bcrypt");

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

// app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, "public")));

// const db = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "chat_app",
// });

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/register", (req, res) => {
  const { userid, username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const query =
    "INSERT INTO users (userid, username, password) VALUES (?, ?, ?)";
  db.query(query, [userid, username, hashedPassword], (err) => {
    if (err) {
      console.error("Error registering user:", err);
      res.status(500).send("Error registering user");
      return;
    }
    res.send("User registered successfully");
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], (err, results) => {
    if (err) {
      console.error("Error logging in:", err);
      res.status(500).send("Error logging in");
      return;
    }

    if (results.length > 0) {
      const user = results[0];

      // Compare the hashed password
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          console.error("Error comparing passwords:", err);
          res.status(500).send("Error logging in");
          return;
        }

        if (result) {
          res.json({
            message: "Login successful",
            userid: user.userid,
            username: user.username,
          });
        } else {
          res.status(401).send("Invalid username or password");
        }
      });
    } else {
      res.status(401).send("Invalid username or password");
    }
  });
});

app.post("/create-group", (req, res) => {
  const { groupname } = req.body;
  const query = "INSERT INTO groupss (groupname) VALUES (?)";
  db.query(query, [groupname], (err) => {
    if (err) {
      console.error("Error creating group:", err);
      res.status(500).send("Error creating group");
      return;
    }
    res.send("Group created successfully");
  });
});

app.get("/group-names", (req, res) => {
  const query = "SELECT * FROM groupss";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching group names:", err);
      res.status(500).send("Error fetching group names");
      return;
    }
    res.json(results);
  });
});

app.post("/add-to-group", (req, res) => {
  const { groupid, userid } = req.body;
  const query = "INSERT INTO group_members (groupid, userid) VALUES (?, ?)";
  db.query(query, [groupid, userid], (err) => {
    if (err) {
      console.error("Error adding user to group:", err);
      res.status(500).send("Error adding user to group");
      return;
    }
    res.send("User added to group successfully");
  });
});

app.get("/group-members", (req, res) => {
  const { currentGroupId } = req.query;
  const query = `
    SELECT u.userid, u.username
    FROM group_members gm
    JOIN users u ON gm.userid = u.userid
    WHERE gm.groupid = ?
  `;
  db.query(query, [currentGroupId], (err, results) => {
    if (err) {
      console.error("Error fetching group members:", err);
      res.status(500).send("Error fetching group members");
      return;
    }
    res.json(results);
  });
});

app.get("/users", (req, res) => {
  const query = "SELECT userid, username FROM users";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching all users:", err);
      res.status(500).send("Error fetching all users");
      return;
    }
    res.json(results);
  });
});

// app.get("/group-messages", (req, res) => {
//   const { groupId, page, limit } = req.query;
//   const offset = (page - 1) * limit;
//   console.log("hello ....",groupId);
//   const query = `
//    SELECT gm.*, u.username AS user
//     FROM group_messages gm
//     JOIN users u ON gm.sender = u.username
//     WHERE gm.groupid = ?
//     ORDER BY gm.created_at ASC
//      LIMIT 10 OFFSET 0
//   `;
//   db.query(query, [groupId, parseInt(limit), offset], (err, results) => {
//     if (err) {
//       console.error("Error fetching group messages:", err);
//       res.status(500).send("Error fetching group messages");
//       return;
//     }
//     res.json(results);
//   });
// });
// API endpoint to get group messages with pagination

// app.get("/group-messages", (req, res) => {
//   const { groupid, page = 1, limit = 10 } = req.query;
//   const offset = (page - 1) * limit;

//   if (!groupid) {
//     return res.status(400).json({ error: "Group ID is required" });
//   }

//   // Query to get the total count of messages for the group
//   const countQuery = `
//     SELECT COUNT(*) AS totalCount
//     FROM group_messages
//     WHERE groupid = ?
//   `;

//   // Query to get the messages for the group with pagination
//   const messagesQuery = `
//     SELECT *
//     FROM group_messages
//     WHERE groupid = ?
//     ORDER BY created_at DESC
//     LIMIT ? OFFSET ?
//   `;

//   // Execute the count query
//   db.query(countQuery, [groupid], (error, countResults) => {
//     if (error) {
//       console.error("Error fetching message count:", error);
//       return res.status(500).json({ error: "Error fetching message count" });
//     }

//     const totalCount = countResults[0].totalCount;

//     // Execute the messages query
//     db.query(
//       messagesQuery,
//       [groupid, parseInt(limit), parseInt(offset)],
//       (error, messagesResults) => {
//         if (error) {
//           console.error("Error fetching messages:", error);
//           return res.status(500).json({ error: "Error fetching messages" });
//         }

//         // Calculate the total pages
//         const totalPages = Math.ceil(totalCount / limit);

//         res.json({
//           messages: messagesResults,
//           pagination: {
//             currentPage: parseInt(page),
//             totalPages: totalPages,
//             totalCount: totalCount,
//           },
//         });
//       }
//     );
//   });
// });
app.get("/group-messages", (req, res) => {
  const { groupid, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  if (!groupid) {
    return res.status(400).json({ error: "Group ID is required" });
  }

  const countQuery = `
    SELECT COUNT(*) AS totalCount
    FROM group_messages
    WHERE groupid = ?
  `;

  const messagesQuery = `
    SELECT *
    FROM group_messages
    WHERE groupid = ?
    ORDER BY created_at asc
    LIMIT ? OFFSET ?
  `;

  db.query(countQuery, [groupid], (error, countResults) => {
    if (error) {
      console.error("Error fetching message count:", error);
      return res.status(500).json({ error: "Error fetching message count" });
    }

    const totalCount = countResults[0].totalCount;

    db.query(
      messagesQuery,
      [groupid, parseInt(limit), parseInt(offset)],
      (error, messagesResults) => {
        if (error) {
          console.error("Error fetching messages:", error);
          return res.status(500).json({ error: "Error fetching messages" });
        }

        const totalPages = Math.ceil(totalCount / limit);

        res.json({
          messages: messagesResults,
          pagination: {
            currentPage: parseInt(page),
            totalPages: totalPages,
            totalCount: totalCount,
          },
        });
      }
    );
  });
});

// New route to fetch group memberships for a user
app.get("/user-groups", (req, res) => {
  const { userid } = req.query;
  const query = `
    SELECT g.groupid, g.groupname
    FROM group_members gm
    JOIN groupss g ON gm.groupid = g.groupid
    WHERE gm.userid = ?
  `;
  db.query(query, [userid], (err, results) => {
    if (err) {
      console.error("Error fetching user groups:", err);
      res.status(500).send("Error fetching user groups");
      return;
    }
    res.json(results);
  });
});

// Existing code
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinRoom", ({ userId, username }) => {
    socket.userId = userId;
    socket.username = username;
    console.log(`User ${username} joined with ID ${userId}`);

    // Fetch groups for the user and emit to the client
    const query = `
      SELECT g.groupid, g.groupname
      FROM group_members gm
      JOIN groupss g ON gm.groupid = g.groupid
      WHERE gm.userid = ?
    `;
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error("Error fetching user groups:", err);
        return;
      }
      socket.emit("user-groups", results);
    });
  });

  socket.on("group-message", (messageData) => {
    const { user, groupid, message, timestamp } = messageData;
    const query = `
      INSERT INTO group_messages (groupid, sender, message, created_at)
      VALUES (?, ?, ?, ?)
    `;
    db.query(query, [groupid, user, message, timestamp], (err) => {
      if (err) {
        console.error("Error saving group message:", err);
        return;
      }
      io.emit("group-message", messageData);
      console.log("Group message inserted successfully");
    });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start server
const PORT = 2379;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
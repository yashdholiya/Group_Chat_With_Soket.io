///// clint side code ///////

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
  console.log("Received groups data:", groups); // Log data for debugging
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

// function handleGroupSelection(groupId) {
//   currentGroupId = groupId;
//   showView("groupChatContainer");
//   fetchGroupMessages(groupId, true);
//   fetchGroupMembers(groupId);
// }
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

///// server side code /////

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

app.get("/group-names", (req, res) => {
  const { userid } = req.query;
  const query = `
    SELECT g.groupid, g.groupname
    FROM group_members gm
    JOIN groupss g ON gm.groupid = g.groupid
    WHERE gm.userid = ?
  `;
  db.query(query, [userid], (err, results) => {
    if (err) {
      console.error("Error fetching group names:", err);
      res.status(500).send("Error fetching group names");
      return;
    }
    res.json(results);
  });
});

// Server-side: Express route to get group chat messages with pagination
app.get("/group-messages", (req, res) => {
  const { groupid, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  // Query to get the total count of messages in the group
  const countQuery = `
    SELECT COUNT(*) AS totalCount
    FROM group_messages
    WHERE groupid = ?
  `;

  const messagesQuery = `
  SELECT gm.message, gm.created_at AS timestamp, u.username AS user
    FROM group_messages gm
    JOIN users u ON gm.sender = u.username
    WHERE gm.groupid = ?
    ORDER BY gm.created_at DESC
    LIMIT ? OFFSET ?
  `;

  db.query(countQuery, [groupid], (error, countResults) => {
    if (error) {
      console.error("Error fetching message count:", error);
      res.status(500).send("Error fetching messages");
      return;
    }

    const totalCount = countResults[0].totalCount;

    db.query(
      messagesQuery,
      [groupid, parseInt(limit), parseInt(offset)],
      (error, messagesResults) => {
        if (error) {
          console.error("Error fetching messages:", error);
          res.status(500).send("Error fetching messages");
          return;
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

// Start server
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinRoom", ({ userId, username }) => {
    socket.userId = userId;
    socket.username = username;
    console.log(`User ${username} joined with ID ${userId}`);

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
      console.log("Groups fetched for user:", results); // Log results for debugging
      socket.emit("user-groups", results);
    });
  });

  socket.on("createGroup", (groupName) => {
    const query = "INSERT INTO groupss (groupname) VALUES (?)";
    db.query(query, [groupName], (err, results) => {
      if (err) {
        console.error("Error creating group:", err);
        return;
      }
      const groupId = results.insertId; // Get the ID of the newly created group
      socket.emit("groupCreated", { groupId, groupName });
    });
  });

  socket.on("addUserToGroup", ({ groupName, userId }) => {
    // Fetch the group ID based on the group name
    const getGroupIdQuery = "SELECT groupid FROM groupss WHERE groupname = ?";
    db.query(getGroupIdQuery, [groupName], (err, results) => {
      if (err) {
        console.error("Error fetching group ID:", err);
        return;
      }
      const groupId = results[0]?.groupid;
      if (!groupId) {
        console.error("Group not found");
        return;
      }

      // Add the user to the group
      const addUserQuery =
        "INSERT INTO group_members (groupid, userid) VALUES (?, ?)";
      db.query(addUserQuery, [groupId, userId], (err) => {
        if (err) {
          console.error("Error adding user to group:", err);
          return;
        }
        // Insert a message indicating that the user has joined the group
        const messageData = {
          user: "System",
          groupid: groupId,
          message: `User with ID ${userId} has joined the group.`,
          timestamp: new Date().toISOString(),
        };
        const insertMessageQuery = `
          INSERT INTO group_messages (groupid, sender, message, created_at)
          VALUES (?, ?, ?, ?)
        `;
        db.query(
          insertMessageQuery,
          [groupId, "System", messageData.message, messageData.timestamp],
          (err) => {
            if (err) {
              console.error("Error inserting join message:", err);
              return;
            }
            io.emit("group-message", messageData); // Notify all clients of the new message
          }
        );
      });
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

const PORT = 2379;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
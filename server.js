// const express = require("express");
// const mysql = require("mysql2");
// const bodyParser = require("body-parser");
// const path = require("path");
// const http = require("http");
// const socketIo = require("socket.io");
// const bcrypt = require("bcrypt");

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

// db.connect((err) => {
//   if (err) {
//     console.error("Error connecting to MySQL database:", err);
//     return;
//   }
//   console.log("Connected to MySQL database");
// });

// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "index.html"));
// });

// app.post("/register", (req, res) => {
//   const { userid, username, password } = req.body;
//   const hashedPassword = bcrypt.hashSync(password, 10);

//   const query =
//     "INSERT INTO users (userid, username, password) VALUES (?, ?, ?)";
//   db.query(query, [userid, username, hashedPassword], (err) => {
//     if (err) {
//       console.error("Error registering user:", err);
//       res.status(500).send("Error registering user");
//       return;
//     }
//     res.send("User registered successfully");
//   });
// });

// app.post("/login", (req, res) => {
//   const { username, password } = req.body;
//   const query = "SELECT * FROM users WHERE username = ?";
//   db.query(query, [username], (err, results) => {
//     if (err) {
//       console.error("Error logging in:", err);
//       res.status(500).send("Error logging in");
//       return;
//     }

//     if (results.length > 0) {
//       const user = results[0];

//       // Compare the hashed password
//       bcrypt.compare(password, user.password, (err, result) => {
//         if (err) {
//           console.error("Error comparing passwords:", err);
//           res.status(500).send("Error logging in");
//           return;
//         }

//         if (result) {
//           res.json({
//             message: "Login successful",
//             userid: user.userid,
//             username: user.username,
//           });
//         } else {
//           res.status(401).send("Invalid username or password");
//         }
//       });
//     } else {
//       res.status(401).send("Invalid username or password");
//     }
//   });
// });

// app.post("/create-group", (req, res) => {
//   const { groupname } = req.body;
//   const query = "INSERT INTO groupss (groupname) VALUES (?)";
//   db.query(query, [groupname], (err) => {
//     if (err) {
//       console.error("Error creating group:", err);
//       res.status(500).send("Error creating group");
//       return;
//     }
//     res.send("Group created successfully");
//   });
// });

// app.get("/group-names", (req, res) => {
//   const query = "SELECT * FROM groupss";
//   db.query(query, (err, results) => {
//     if (err) {
//       console.error("Error fetching group names:", err);
//       res.status(500).send("Error fetching group names");
//       return;
//     }
//     res.json(results);
//   });
// });

// app.post("/add-to-group", (req, res) => {
//   const { groupid, userid } = req.body;
//   const query = "INSERT INTO group_members (groupid, userid) VALUES (?, ?)";
//   db.query(query, [groupid, userid], (err) => {
//     if (err) {
//       console.error("Error adding user to group:", err);
//       res.status(500).send("Error adding user to group");
//       return;
//     }
//     res.send("User added to group successfully");
//   });
// });

// app.get("/group-members", (req, res) => {
//   const { currentGroupId } = req.query;
//   const query = `
//     SELECT u.userid, u.username
//     FROM group_members gm
//     JOIN users u ON gm.userid = u.userid
//     WHERE gm.groupid = ?
//   `;
//   db.query(query, [currentGroupId], (err, results) => {
//     if (err) {
//       console.error("Error fetching group members:", err);
//       res.status(500).send("Error fetching group members");
//       return;
//     }
//     res.json(results);
//   });
// });

// app.get("/users", (req, res) => {
//   const query = "SELECT userid, username FROM users";
//   db.query(query, (err, results) => {
//     if (err) {
//       console.error("Error fetching all users:", err);
//       res.status(500).send("Error fetching all users");
//       return;
//     }
//     res.json(results);
//   });
// });

// // New route to fetch group memberships for a user
// app.get("/user-groups", (req, res) => {
//   const { userid } = req.query;
//   const query = `
//     SELECT g.groupid, g.groupname
//     FROM group_members gm
//     JOIN groupss g ON gm.groupid = g.groupid
//     WHERE gm.userid = ?
//   `;
//   db.query(query, [userid], (err, results) => {
//     if (err) {
//       console.error("Error fetching user groups:", err);
//       res.status(500).send("Error fetching user groups");
//       return;
//     }
//     res.json(results);
//   });
// });

// // Server-side: Express route to get group chat messages with pagination
// app.get("/group-messages", (req, res) => {
//   const { groupid, page = 1, limit = 10 } = req.query;
//   const offset = (page - 1) * limit;

//   // Query to get the total count of messages in the group
//   const countQuery = `
//     SELECT COUNT(*) AS totalCount
//     FROM group_messages
//     WHERE groupid = ?
//   `;

//   const messagesQuery = `
//   SELECT gm.message, gm.created_at AS timestamp, u.username AS user
//     FROM group_messages gm
//     JOIN users u ON gm.sender = u.username
//     WHERE gm.groupid = ?
//     ORDER BY gm.created_at DESC
//     LIMIT ? OFFSET ?
//   `;

//   db.query(countQuery, [groupid], (error, countResults) => {
//     if (error) {
//       console.error("Error fetching message count:", error);
//       res.status(500).send("Error fetching messages");
//       return;
//     }

//     const totalCount = countResults[0].totalCount;

//     db.query(
//       messagesQuery,
//       [groupid, parseInt(limit), parseInt(offset)],
//       (error, messagesResults) => {
//         if (error) {
//           console.error("Error fetching messages:", error);
//           res.status(500).send("Error fetching messages");
//           return;
//         }

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

// // Existing code
// io.on("connection", (socket) => {
//   console.log("A user connected");

//   socket.on("joinRoom", ({ userId, username }) => {
//     socket.userId = userId;
//     socket.username = username;
//     console.log(`User ${username} joined with ID ${userId}`);

//     // Fetch groups for the user and emit to the client
//     const query = `
//       SELECT g.groupid, g.groupname
//       FROM group_members gm
//       JOIN groupss g ON gm.groupid = g.groupid
//       WHERE gm.userid = ?
//     `;
//     db.query(query, [userId], (err, results) => {
//       if (err) {
//         console.error("Error fetching user groups:", err);
//         return;
//       }
//       socket.emit("user-groups", results);
//     });
//   });

//   socket.on("group-message", (messageData) => {
//     const { user, groupid, message, timestamp } = messageData;
//     const query = `
//       INSERT INTO group_messages (groupid, sender, message, created_at)
//       VALUES (?, ?, ?, ?)
//     `;
//     db.query(query, [groupid, user, message, timestamp], (err) => {
//       if (err) {
//         console.error("Error saving group message:", err);
//         return;
//       }
//       io.emit("group-message", messageData);
//       console.log("Group message inserted successfully");
//     });
//   });

//   socket.on("disconnect", () => {
//     console.log("A user disconnected");
//   });
// });

// // Start server
// const PORT = 2379;
// server.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });
/*
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
*/

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
      console.log("Groups fetched for user:", results);
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
      const groupId = results.insertId;
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

      const addUserQuery =
        "INSERT INTO group_members (groupid, userid) VALUES (?, ?)";
      db.query(addUserQuery, [groupId, userId], (err) => {
        if (err) {
          console.error("Error adding user to group:", err);
          return;
        }

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
            io.emit("group-message", messageData);
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

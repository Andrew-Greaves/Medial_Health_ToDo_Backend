const express = require("express");
const app = express();
const fs = require("fs");
const cors = require("cors");

//Middleware
app.use(cors()); //Prevents network error
app.use(express.json()); //Allows for json parsing

//Get all tasks
app.get("/tasks", async (req,res) => {
    fs.readFile("./Task List.json",(err,data) => { //reads json file
        if (err) {
          return res.status(500).send("Error reading file");
        }
        let jsonData = JSON.parse(data); //turn json data to js object
        res.json(jsonData)
    })
})

//Add new task to Json file
app.post("/addtask", async (req,res) => {
    const {id, title, description, dueDate, assignee, priorityLevel, notes, status} = req.body; //get variables from request body
    
    fs.readFile("./Task List.json", (err, data) => { //reads json file
      if (err) {
        return res.status(500).send("Error reading file");
      }

      let jsonData = JSON.parse(data); //turns json data in js object

      // Check if the assignee already exists
      let existingUser = jsonData.find(
        (task) => task.assignee.displayName === assignee.displayName
      );
      let userId;

      if (existingUser) {
        // Use existing userId
        userId = existingUser.assignee.userId;
      } else {
        // Assign a new userId
        let maxUserId = jsonData.reduce(
          (max, task) => Math.max(max, parseInt(task.assignee.userId)), //Searches for largest userId
          0 //max is set to 0 initially 
        );
        userId = (maxUserId + 1).toString(); //increments id by 1 for new user
      }

      const newTask = {
        //make new task object from request body variables and userId
        id: id,
        title: title,
        description: description,
        dueDate: dueDate,
        assignee: {
          userId: userId,
          displayName: assignee.displayName,
        },
        priorityLevel: priorityLevel,
        notes: notes,
        status: status,
      }; 

      
      jsonData.push(newTask); //append new task to the end of tasks array
      try {
        fs.writeFile(
          "./Task List.json",
          JSON.stringify(jsonData, null, 2), //turn array back to JSON and indent for readibility
          (err) => {
            //overwrite Json file with new list of tasks
            if (err) {
              return res.status(500).send("Error writing to file");
            }
            res.json(jsonData);
          }
        );
      } catch (error) {
        return res.status(500).send("Error parsing JSON");
      }
    })
});

//Deletes a task given its ID
app.delete("/deletetask/:id",async (req,res)=>{
    const id = req.params.id; //get id from request url
    fs.readFile("./Task List.json", (err, data) => {
      if (err) {
        return res.status(500).send("Error reading file");
      }
      let jsonData = JSON.parse(data); //turn json data to js object
      let existingTask=jsonData.find( //find task to delete
        (task) => task.id === id
      );

      if(existingTask){ //if task exists, remove it using filter method 
        const newTasks=jsonData.filter((task)=>task.id!==existingTask.id);
        try {
          fs.writeFile(
            "./Task List.json",
            JSON.stringify(newTasks, null, 2), //turn array back to JSON and indent for readibility
            (err) => {
              //overwrite Json file with new list of tasks
              if (err) {
                return res.status(500).send("Error writing to file");
              }
              res.json({message:"Task Deleted successfully"}); //return message to user
            }
          );
        } catch (error) {
          return res.status(500).send("Error parsing JSON");
        }
      }else{
        return res.status(500).send("Task does not exist");
      }
    });
})

app.put("/edittask/:id",async (req,res) => {
    const id = req.params.id;
    const {title, description, dueDate, assignee, priorityLevel, notes, status} = req.body
    fs.readFile("./Task List.json", (err, data) => {
      //reads json file
      if (err) {
        return res.status(500).send("Error reading file");
      }
      let jsonData = JSON.parse(data); //turn json data to js object
      // Map through the array of tasks to create a new array
      let updatedJsonData = jsonData.map((task) => {
        // Check if the current task's id matches the id provided in the request
        if (task.id === id) {
          // Check if the displayName has changed
          let hasDisplayNameChanged =
            task.assignee.displayName !== assignee.displayName;
          let newUserId;
          if (hasDisplayNameChanged) {
            // Find if the new displayName exists in any other task
            let existingUser = jsonData.find(
              (otherTask) =>
                otherTask.assignee.displayName === assignee.displayName
            );

            if (existingUser) {
              // Use existing userId
              newUserId = existingUser.assignee.userId;
            } else {
              // Assign a new userId
              let maxUserId = jsonData.reduce(
                (max, task) => Math.max(max, parseInt(task.assignee.userId)),
                0
              );
              newUserId = (maxUserId + 1).toString();
            }
          } else {
            // Keep the same userId
            newUserId = task.assignee.userId;
          }

          // Return the updated task object
          // Spread operator (...) is used to copy properties from the original task
          // Then, overwrite the task properties with the new values from the request
          return {
            ...task,
            title,
            description,
            dueDate,
            assignee: { userId: newUserId, displayName: assignee.displayName },
            priorityLevel,
            notes,
            status,
          };
        }
        // If it's not the task we're looking for, return the original task without modifications
        return task;
      });
      try {
        fs.writeFile(
          "./Task List.json",
          JSON.stringify(updatedJsonData, null, 2), //turn array back to JSON and indent for readibility
          (err) => {
            //overwrite Json file with new list of tasks
            if (err) {
              return res.status(500).send("Error writing to file");
            }
            res.json(updatedJsonData); //return new list of tasks to user
          }
        );
      } catch (error) {
        return res.status(500).send("Error parsing JSON");
      }
    });
})


app.listen(5000,() => console.log("Server running on port 5000"));
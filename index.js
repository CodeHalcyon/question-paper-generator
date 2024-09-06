const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const path = require("path");
require('dotenv').config();
const multer = require('multer');
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const fs = require("fs");
const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, HeadingLevel} = require("docx");
const {getQuestionsFromDB} = require("./helpers/getQuestionsFromDB")
const doctocsv = require("./helpers/convertDocxTablesToCsv")
const csvtodb = require("./helpers/importToMongo")
const {getExistingCollections} = require("./helpers/getExistingCollections")
const root = require("./root")



const app = express();
const port = process.env.PORT || 3000

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads'); // Specify the directory to store uploaded files
  },
  filename: (req, file, cb) => {
      cb(null, "input.docx"); // Generate a unique filename
  }
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });


app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname,"/public")))

const uri = process.env.MONGODB_URI
app.get("/",(req,res)=>{
  res.render("index")
})

let collectionname = []
let collectionA="", collectionB=""
app.post("/upload", upload.single('file'), async (req, res) => {
  try {
    console.log(req.body);
    
    console.log(req.file); // Contains file info
    console.log(req.body); // Contains text fields from the form


    // Access the uploaded file path using req.file.path
    const uploadedFilePath = req.file.path;
    // Convert DOCX to CSV
    await doctocsv.convertDocxTablesToCsv(uploadedFilePath);
    
    // Define collection names
    collectionA = `${req.body.subName}_A`.trim();
    collectionB = `${req.body.subName}_B`.trim();

    // console.log(`Checking if collections already exist: ${collectionA}, ${collectionB}`);
    
    // Check if data already exists in the database
    const existingCollections = await getExistingCollections([collectionA, collectionB]);
    // console.log(`Existing collections: ${existingCollections}`);

    // Import CSV files only if collections do not exist
    if (!existingCollections.includes(collectionA)) {
      // console.log(`Importing CSV to collection: ${collectionA}`);
      await csvtodb.importCsvToMongo(`${root}/misc/generatedCsvs/output_table_1.csv`, collectionA);
      // console.log(`CSV import successful for collection: ${collectionA}`);
    } else {
      // console.log(`Collection ${collectionA} already exists, skipping import.`);
    }

    if (!existingCollections.includes(collectionB)) {
      // console.log(`Importing CSV to collection: ${collectionB}`);
      await csvtodb.importCsvToMongo(`${root}/misc/generatedCsvs/output_table_2.csv`, collectionB);
      // console.log(`CSV import successful for collection: ${collectionB}`);
    } else {
      // console.log(`Collection ${collectionB} already exists, skipping import.`);
    }

    if (!res.headersSent) {
      res.redirect("/display");
    }
    // Set collection names for display route
    collectionname = [collectionA, collectionB];

    // console.log('Redirecting to /display...');
    // Redirect to display page
    res.redirect("/display");
  } catch (error) {
    console.error("Error processing upload:", error);
    // res.send("something went wrong try again later :(")
    res.render("error")
  }
});

app.get("/display", async (req, res) => {
  try {
    // console.log(collectionname);
    const questions = await getQuestionsFromDB(collectionA);
    const questions2 = await getQuestionsFromDB(collectionB);
    res.render("display", { questions, questions2 });
  } catch (error) {      
    // res.status(500).send("Error fetching questions");
    res.render("error")

  }  
});

app.post("/generate-paper", async (req, res) => {
  const selectedQuestionIdsA = req.body.selectedQuestionsA;
  const selectedQuestionIdsB = req.body.selectedQuestionsB;
  // console.log(selectedQuestionIdsA);
  // console.log(selectedQuestionIdsB);
  

  if (!selectedQuestionIdsA) return res.status(400).send("No questions selected from Part A.");
  if (!selectedQuestionIdsB) return res.status(400).send("No questions selected. from Part B");

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
      await client.connect();
      const database = client.db("testing1");
      const collections = await database.listCollections().toArray();
      let i=0
      collections.forEach(collection => {
        collectionname[i] = collection.name
        i++
      });
      console.log("collection array", collectionname);
      
    const collectA = database.collection(collectionA);
    const collectB = database.collection(collectionB);

    const objectIdsA = Array.isArray(selectedQuestionIdsA) ? selectedQuestionIdsA.map(id => new ObjectId(id)) : [new ObjectId(selectedQuestionIdsA)];
    const objectIdsB = Array.isArray(selectedQuestionIdsB) ? selectedQuestionIdsB.map(id => new ObjectId(id)) : [new ObjectId(selectedQuestionIdsB)];

    const selectedQuestionsA = await collectA.find({ _id: { $in: objectIdsA } }).toArray();
    const selectedQuestionsB = await collectB.find({ _id: { $in: objectIdsB } }).toArray();

    // Generate Word Document with the selected questions
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "PART A",
                  size: 28, // Font size is in half-points, so 24 points * 2 = 48
                  bold: true, // Optional: Make the text bold
                  color:"000000"
                }),
              ],
              heading: HeadingLevel.HEADING_1, // Optional: This can be omitted if you don't want heading style
            }),
            createQuestionsTable(selectedQuestionsA,"A"), // Function to create a table in the document
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "PART B",
                  size: 28, // Font size is in half-points, so 24 points * 2 = 48
                  bold: true, // Optional: Make the text bold
                  color:"000000"
                }),
              ],
              heading: HeadingLevel.HEADING_1, // Optional: This can be omitted if you don't want heading style
            }),
            createQuestionsTable(selectedQuestionsB, "B")
          ],
        },
      ],
    });
    

    const b64string = await Packer.toBase64String(doc);
    res.setHeader("Content-Disposition", 'attachment; filename="Selected_Questions.docx"');
    res.send(Buffer.from(b64string, 'base64'));
  }catch (error) {
  console.error("Error connecting to MongoDB or performing operations:", error);
  if (!res.headersSent) {
    // res.status(500).send("Error processing request");
    res.render("error")

  }
} finally {
  await client.close();
}
});

app.get("/success",(req,res)=>{
  res.send("Done generating")
})

function createQuestionsTable(questions, choice) {
  const tableWidth = 100; // Full width of the page (100%)

  const tableRows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: tableWidth * 0.1, type: WidthType.PERCENTAGE }, // 10% of total width
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Q No", bold: true, size: 28 })], // Font size 20
            }),
          ],
        }),
        new TableCell({
          width: { size: tableWidth * 0.5, type: WidthType.PERCENTAGE }, // 50% of total width
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Questions", bold: true, size: 28 })], // Font size 20
            }),
          ],
        }),
        new TableCell({
          width: { size: tableWidth * 0.1, type: WidthType.PERCENTAGE }, // 10% of total width
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Marks", bold: true, size: 28 })], // Font size 20
            }),
          ],
        }),
        new TableCell({
          width: { size: tableWidth * 0.1, type: WidthType.PERCENTAGE }, // 15% of total width
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Bloom's Level", bold: true, size: 28 })], // Font size 20
            }),
          ],
        }),
        new TableCell({
          width: { size: tableWidth * 0.2, type: WidthType.PERCENTAGE }, // 15% of total width
          children: [
            new Paragraph({
              children: [new TextRun({ text: "CO", bold: true, size: 28 })], // Font size 20
            }),
          ],
        }),
      ],
    }),
  ];
  let saq=[]
  if(choice === "A")
  saq = ["1a","1b","1c","1d","1e"]
  else
  saq = ["2a","2b","3","4a","4b","5","6","7"]


  questions.forEach((question, index) => {
    if(saq[index] === "3" ||saq[index] === "5" ||saq[index] === "7"){
      tableRows.push(new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "OR", size: 28})], alignment: "center" })], // Font size 20,
            columnSpan: 5
          })
        ],
      }))
    }
    tableRows.push(
      
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: `${saq[index]}`, size: 28 })] })], // Font size 20
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: question.Questions, size: 28 })] })], // Font size 20
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: question.Marks, size: 28 })] })], // Font size 20
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: question.BL, size: 28 })] })], // Font size 20
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: question.CO, size: 28 })] })], // Font size 20
          }),
        ],
      })
    );
  });
  

  return new Table({ rows: tableRows });
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


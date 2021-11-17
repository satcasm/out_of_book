require('dotenv').config();
const obj2gltf = require("obj2gltf");
const fs = require("fs");
const express = require('express');
const app = express();
app.set("view engine", "ejs");
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const {spawn} = require('child_process');
app.use(express.urlencoded({ extended: true }));
app.use(express.json({limit: "50m"}));
app.use(express.urlencoded({limit: "50mb", extended: false}));
app.use(express.static(__dirname + '/public'));
cloudinary.config({ 
    cloud_name: 'satcasm', 
    api_key: process.env.API_KEY, 
    api_secret:process.env.API_SECRET
});


const upload = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/png||jpeg||jpg||gif$i/)) {
            cb(new Error('File does not support'), false);
            return;
        }
        cb(null, true);
    }
});

app.get('/', async (req, res) => {
  
    res.render('index');
});
app.post('/',upload.single("image"), async(req, res) => {
    let result= await cloudinary.uploader.upload(req.file.path);
    let dataToSend;
    // spawn new child process to call the python script
    const python = spawn('python', ['./content/pifuhd_demo (1).py',result.secure_url]);
    // collect data from script
    python.stdout.on('data', function (data) {
        dataToSend = data.toString();
    });
    // in close event we are sure that stream from child process is closed
   python.on('close', (code) => {
        // res.send(dataToSend);
        obj2gltf("./content/pifuhd/results/pifuhd_final/recon/random.obj").then(function (gltf) {
            const data = Buffer.from(JSON.stringify(gltf));
            fs.writeFileSync("model.gltf", data);
        });
        res.render("result");
    });
});


app.listen(3000, () => {
	console.log(`Server started!`);
});

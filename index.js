const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const mongoose = require("mongoose");
const app = express();
const _ = require('lodash');
mongoose.connect("mongodb://127.0.0.1:27017/noorStore",{useNewUrlParser:true})
const cartItemsSchema={
  title:String,
  price:Number,
  description:String,
  rating:Number,
  image:String

}
const recommendSchema={
  arr:[]
}
const customerSchema={
  firstname:String,
  lastname:String,
  email:String,
  password:String,
  itemcart:[]
}
//collection
//item stores only the cart items
const Item = mongoose.model("Item",cartItemsSchema);
const Recommended=mongoose.model("Recommended",cartItemsSchema);
const Customer=mongoose.model("Customer",customerSchema);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.static("images"));

const PORT = process.env.PORT || 3000;

app.get("/", async (req, res) => {
  //fetch data from API using axios
  try {
    const apiUrl = "https://fakestoreapi.com/products/categories";

    const response = await axios.get(apiUrl);
    const data = JSON.stringify(response.data);
 

    res.render("homepage",{category: JSON.parse(data)});
  }catch (error) {
    console.error("Error fetching data from the external API:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/cart", async (req, res) => {
  //fetch data from API using axios
  try {
    const recommendedarray = await Recommended.find().exec();

    const items = await Item.find().exec();
    let totalcost=0;
    
    items.forEach(e=>{
      totalcost+=e.price;
    })
console.log(recommendedarray[1]);
    res.render("shopcart", { data: items, rec: recommendedarray,total:totalcost , count:items.length});
  }catch (error) {
    console.error("Error fetching data from the external API:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.get("/:categoryName", async (req, res) => {
  try {
    const categoryName = req.params.categoryName;
    let apiUrl;
    const electronicsArray=[]
    const jewelleryArray=[]
    const menClothingArray=[]
    const womenClothingArray=[]
   

    apiUrl = "https://fakestoreapi.com/products";
    const response = await axios.get(apiUrl);
    const data = JSON.stringify(response.data);
    const products = JSON.parse(data);
    const selectedPriceRange = req.query.priceRange || 'all'
    let lower=0;
    let upper=0
    if(selectedPriceRange!='all'){
      console.log("price"+selectedPriceRange);
      let numericValue = parseInt(selectedPriceRange, 10); 
       lower=numericValue+1
       upper=lower+200

    }
    const remove=req.query.removefilter;
   

    for (let i = 0; i < products.length; i++) {
      const productCategory = products[i].category;
      
      if (productCategory === "jewelery") {
        
        if(selectedPriceRange != 'all'){
        if(products[i].price>=lower && products[i].price<=upper){
          jewelleryArray.push(products[i]) 
        }
       
        }else{  jewelleryArray.push(products[i]);}
      
      } else if (productCategory === "electronics") {
        if(selectedPriceRange != 'all'){
          if(products[i].price>=lower && products[i].price<=upper){
            electronicsArray.push(products[i]) 
          }
         
          }else{  electronicsArray.push(products[i]);}
      } else if (productCategory === "men's clothing") {
        if(selectedPriceRange != 'all'){
          if(products[i].price>=lower && products[i].price<=upper){
            menClothingArray.push(products[i]) 
          }
         
          }else{  menClothingArray.push(products[i]);}
      }else if (productCategory === "women's clothing") {
        if(selectedPriceRange != 'all'){
          if(products[i].price>=lower && products[i].price<=upper){
            womenClothingArray.push(products[i]) 
          }
         
          }else{ womenClothingArray.push(products[i]);}
      }
      else {
      console.log("not here");
      }
    }
  
    if (categoryName === "electronics") {
    
      res.render("products", { arr:electronicsArray, category: categoryName });
    } else if (categoryName === "jewelery") {
      res.render("products", { arr: jewelleryArray, category: categoryName});
    } else if (categoryName === "men's clothing") {
      res.render("products", { arr: menClothingArray, category: categoryName});
    } else if (categoryName === "women's clothing") {
      res.render("products", { arr: womenClothingArray, category: categoryName });
    } else {
      console.log("nothing");
    }
  } catch (error) {
    console.error("Error fetching data from the external API:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post('/cart', async (req, res) => {
  try {
      const cart = [];
      const title = req.body.proTitle;
      const apiUrl = 'https://fakestoreapi.com/products';
    
      const response = await axios.get(apiUrl);
      const data = JSON.stringify(response.data);
    const products = JSON.parse(data);
    const items=[]
   
      products.forEach(element => {
          if (element.title === title) {
              cart.push(element);

              const item1=new Item({
                title: title,
                price:element.price,
                description:element.description,
                rating:element.rating.rate,
                image:element.image
          
              })
              items.push(item1)
          }
      });
      Item.insertMany(items)
      .then(() => {
        console.log("Success saved");
      })
      .catch((err) => {
        console.error(err);
      });
     
      products.forEach(e=>{
        if(e.category==cart[0].category){
          // recommendedarray.push(e)
          const i=new Recommended({
            title: e.title,
            price:e.price,
            description:e.description,
            rating:e.rating.rate,
            image:e.image
          })
          console.log(i);
          Recommended.insertMany(i)
          .then(() => {
            console.log("Success saved");
          }).catch((err) => {
            console.error(err);
          });
        
        }
      })
     res.redirect("/cart")
     
  } catch (error) {

      console.error('Error fetching data from the external API:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get("/delete/:title", async (req, res) => {
  //fetch data from API using axios
  try {
    const title = req.params.title;
  
    console.log("the title is "+typeof(title));
    Item.findOneAndDelete({ _id: title})
    .then((deletedItem) => {
      if (deletedItem) {
        console.log(' successfully deleted.');
      } else {
        console.log(`not found. ${deletedItem}`);
      }
    })
    .catch((error) => {
      console.error(`Error deleting item: ${error.message}`);
    });
   res.redirect("/cart")
  
  }catch (error) {
   
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

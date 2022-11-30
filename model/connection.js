const { Sequelize, DataTypes } = require("sequelize");

// const sequelize = new Sequelize('ace_gifting', 'ace', 'giftingsolutions@123', {
//     host: 'localhost',
//     dialect: 'mysql',
//     logging: false, //sql query logging in console
//     pool: { max: 5, min: 0, idle: 10000 }
// })
const sequelize = new Sequelize('ace_gifting', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false, //sql query logging in console
    pool: { max: 5, min: 0, idle: 10000 }
})

// const sequelize = new Sequelize('a5inepro_ace_nuxt', 'a5inepro_ace_nuxt', 'Subham88676',{
//     host:'162.251.85.215',
//     dialect: 'mysql',
//     logging: false, //sql query logging in console
//     pool:{max:5,min:0,idle:10000}
// })


sequelize.authenticate()
    .then(() => {
        console.log("database connected");
    })
    .catch((err) => {
        console.log('error: ', err);
    })

const db = {};
db.sequelize = Sequelize;
db.sequelize = sequelize;

db.sequelize.sync({ force: false })
    .then(() => {
        console.log("synced")
    })
    .catch((err) => {
        console.log('error: ', err);
    })

//usermodel
const User = require('./users')(sequelize, DataTypes);
db.users = User;

//homepagesecondsectionmodel
const homePageSecondSection = require('./homePageSecondSection')(sequelize, DataTypes);
db.homePageSecondSection = homePageSecondSection;

//homepagesecondsectionmodel
const homePageSecondSectionBanner = require('./homePageSecondSectionBanner')(sequelize, DataTypes);
db.homePageSecondSectionBanner = homePageSecondSectionBanner;

//homepagethirdsectionmodel
const homePageThirdSection = require('./homePageThirdSection')(sequelize, DataTypes);
db.homePageThirdSection = homePageThirdSection;

//homepagethirdsectioncontentmodel
const homePageThirdSectionContent = require('./homePageThirdSectionContent')(sequelize, DataTypes);
db.homePageThirdSectionContent = homePageThirdSectionContent;

//homepagefifthsectionmodel
const homePageFifthSection = require('./homePageFifthSection')(sequelize, DataTypes);
db.homePageFifthSection = homePageFifthSection;

//homepagefifthsectioncontentmodel
const homePageFifthSectionContent = require('./homePageFifthSectionContent')(sequelize, DataTypes);
db.homePageFifthSectionContent = homePageFifthSectionContent;

//testimonialmodel
const testimonial = require('./testimonial')(sequelize, DataTypes);
db.testimonial = testimonial;

//contactmodel
const enquiry = require('./enquiry')(sequelize, DataTypes);
db.enquiry = enquiry;

//productCategoriesmodel
const productCategories = require('./productCategories')(sequelize, DataTypes);
db.productCategories = productCategories;

//productCategoriesmodel
const productSubCategories = require('./productSubCategories')(sequelize, DataTypes);
db.productSubCategories = productSubCategories;

//productmodel
const product = require('./product')(sequelize, DataTypes);
db.product = product;

//orderRequestmodel
const orderRequest = require('./orderRequest')(sequelize, DataTypes);
db.orderRequest = orderRequest;

//orderRequestProductmodel
const orderRequestProduct = require('./orderRequestProduct')(sequelize, DataTypes);
db.orderRequestProduct = orderRequestProduct;


//user-homepagesecondsectionmodel
User.hasMany(homePageSecondSection, { as: "homePageSecondSection" });
homePageSecondSection.belongsTo(User, {
    foreignKey: "userId",
});


//user-homepagesecondsectionbannermodel
User.hasMany(homePageSecondSectionBanner, { as: "homePageSecondSectionBanner" });
homePageSecondSectionBanner.belongsTo(User, {
    foreignKey: "userId",
});

//user-homepagesecondsectionmodel
User.hasMany(homePageThirdSection, { as: "homePageThirdSection" });
homePageThirdSection.belongsTo(User, {
    foreignKey: "userId",
});

//user-homepagethirdsectioncontentmodel
User.hasMany(homePageThirdSectionContent, { as: "homePageThirdSectionContent" });
homePageThirdSectionContent.belongsTo(User, {
    foreignKey: "userId",
});

//user-homepagethirdsectioncontentmodel
User.hasMany(homePageFifthSection, { as: "homePageFifthSection" });
homePageFifthSection.belongsTo(User, {
    foreignKey: "userId",
});

//user-homepagethirdsectioncontentmodel
User.hasMany(homePageFifthSectionContent, { as: "homePageFifthSectionContent" });
homePageFifthSectionContent.belongsTo(User, {
    foreignKey: "userId",
});

//user-testimonial
User.hasMany(testimonial, { as: "testimonial" });
testimonial.belongsTo(User, {
    foreignKey: "userId",
});

//user-productCategories
User.hasMany(productCategories, { as: "productCategories" });
productCategories.belongsTo(User, {
    foreignKey: "userId",
});

//user-productSubCategories
User.hasMany(productSubCategories, { as: "productSubCategories" });
productSubCategories.belongsTo(User, {
    foreignKey: "userId",
});

//user-product
User.hasMany(product, { as: "product" });
product.belongsTo(User, {
    foreignKey: "userId",
});

//productCategory-product
productCategories.hasMany(product, { as: "products" });
product.belongsTo(productCategories, {
    foreignKey: "productCategoryId",
    as: "productCategories"
});

//productSubCategory-product
productSubCategories.hasMany(product, { as: "subProducts" });
product.belongsTo(productSubCategories, {
    foreignKey: "productSubCategoryId",
    as: "productSubCategories"
});

//productCategory-product
productCategories.hasMany(productSubCategories, { as: "productSubCategories" });
productSubCategories.belongsTo(productCategories, {
    foreignKey: "productCategoryId",
    as: "productCategories"
});

//orderRequest-orderRequestProduct
orderRequest.hasMany(orderRequestProduct, { as: "orderRequestProducts" });
orderRequestProduct.belongsTo(orderRequest, {
    foreignKey: "orderRequestId",
});

//product-orderRequestProduct
product.hasOne(orderRequestProduct, { as: "product" });
orderRequestProduct.belongsTo(product, {
    foreignKey: "productId",
});




module.exports = db;
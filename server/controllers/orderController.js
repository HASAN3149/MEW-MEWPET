import Order from "../models/Order.js";
import User from "../models/User.js"
import Product from "../models/Product.js";
import stripe from "stripe"

// Initialize Stripe with your secret key outside the function
// Make sure process.env.STRIPE_SECRET_KEY is correctly set in your .env file
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);


export const placeOrderCOD = async (req, res) => {
    try {
        const userId = req.user._id;
        const { items, address } = req.body;

        if (!address || items.length === 0) {
            return res.json({ success: false, message: "Invalid data" });
        }

        let amount = 0;

        for (let item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                console.error(`Backend placeOrderCOD: Product with ID ${item.product} not found.`);
                return res.json({ success: false, message: `Product with ID ${item.product} not found.` });
            }
            amount += product.offerPrice * item.quantity;
        }

        amount += Math.floor(amount * 0.02); // Adding 2% tax

        const newOrder = await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD",
            isPaid: false, // Explicitly set for COD
        });

        console.log("Backend placeOrderCOD: New order placed successfully:", newOrder._id);
        return res.json({ success: true, message: "Order Placed Successfully" });
    } catch (error) {
        console.error("Backend placeOrderCOD: Error placing order:", error); // Use console.error for errors
        return res.json({ success: false, message: error.message });
    }
};


//Get Order By User Id:/api/order/user
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log("Backend getUserOrders: Fetching orders for userId:", userId); // <-- NEW LOG

        const orders = await Order.find({
            userId,
            $or: [{ paymentType: "COD" }, { isPaid: true }],
        })
            .populate("items.product") // Populate product details for each item
            .populate("address")       // Populate address details
            .sort({ createdAt: -1 }); // Sort by creation date, newest first

        console.log("Backend getUserOrders: Query results - Number of orders found:", orders.length); // <-- NEW LOG
        if (orders.length > 0) {
            console.log("Backend getUserOrders: First order details (if any):", JSON.stringify(orders[0], null, 2)); // <-- NEW LOG: Log first order for detailed inspection
        }

        res.json({ success: true, orders });
    } catch (error) {
        console.error("Backend getUserOrders: Error fetching user orders:", error); // Use console.error for errors
        res.json({ success: false, message: error.message });
    }
};


//get All orders (for seller/admin): /api/order/seller
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [{ paymentType: "COD" }, { isPaid: true }],
        })
            .populate("items.product")
            .populate("address")
            .sort({ createdAt: -1 });

        res.json({ success: true, orders });
    } catch (error) {
        console.error("Backend getAllOrders: Error fetching all orders:", error);
        res.json({ success: false, message: error.message });
    }
};


//place Order Stripe :/api/order/stripe
export const placeOrderStripe = async (req, res) => {
    try {
        const userId = req.user._id; // This is a Mongoose ObjectId
        const { items, address } = req.body;
        const { origin } = req.headers;

        if (!address || items.length === 0) {
            return res.json({ success: false, message: "Invalid data" });
        }

        let productData = [];
        let amount = 0;

        for (let item of items) {
            const product = await Product.findById(item.product);
            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity
            })

            if (!product) {
                console.error(`Backend placeOrderStripe: Product with ID ${item.product} not found.`);
                return res.json({ success: false, message: `Product with ID ${item.product} not found.` });
            }
            amount += product.offerPrice * item.quantity;
        }

        amount += Math.floor(amount * 0.02); // Adding 2% tax

        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "Online",

        });

        //Stripe Gateway initialize
        // const stripeInstance=new stripe(process.env.STRIPE_SECRET_KEY); // Moved to top level for better practice

        const line_items = productData.map((item) => {
            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: (item.price + item.price * 0.02) * 100
                },
                quantity: item.quantity,
            }
        })

        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${origin}/loader?next=/my-orders`,
            cancel_url: `${origin}/cart`,
            metadata: {
                orderId: order._id.toString(), // <-- FIX: Convert ObjectId to String
                userId: userId.toString(),      // <-- FIX: Convert ObjectId to String
            }

        })

        return res.json({ success: true, url: session.url });
    } catch (error) {
        console.error("Backend Online: Error placing order:", error); // Use console.error for errors
        return res.json({ success: false, message: error.message });

    }
};

//Stripe Webhooks to verify Payments Action :/stripe

export const stripeWebhooks=async(requestAnimationFrame,response)=>{
    //Stripe Gateway Initialize
    const stripeInstance=new stripe(process.env.STRIPE_SECRET_KEY);

    const sig=requestAnimationFrame.headers["stripe-signature"]
    let event;
    try{
        event=stripeInstance.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        )

    }catch(error){
         response.status(400).send(`Webhook Error: ${error.message}`)
    }

    //handle the event

    switch(event.type){
        case "payment_intent.succeeded":{
            const paymentIntent=event.data.object;
            const paymentIntentId=paymentIntent.id;

            //Getting Session Metadata

            const session=await stripeInstance.checkout.sessions.list({
                payment_intent:paymentIntentId,
            });

            const {orderId,userId}=session.data[0].metadata;

            //Mark Payment as Paid

            await Order.findByIdAndUpdate(orderId,{isPaid:true})

            //clear user cart
            await User.findByIdAndUpdate(userId,{cartItems:{}})

              break;

        }
        case "payment_intent.payment_failed":{
            const paymentIntent=event.data.object;
            const paymentIntentId=paymentIntent.id;

            //Getting Session Metadata

            const session=await stripeInstance.checkout.sessions.list({
                payment_intent:paymentIntentId,
            });

            const {orderId}=session.data[0].metadata;

            

            await Order.findByIdAndDelete(orderId)

                  break;
        }
                  
        default:
            console.error(`Unhandled event type ${event.type}`)
            break;
    }
    response.json({received:true});
    

}

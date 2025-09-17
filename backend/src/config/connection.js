

import mongoose from "mongoose";
export default async function main(){
    await mongoose.connect(process.env.DATABASE_URL);
}

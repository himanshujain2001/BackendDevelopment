import { timeStamp } from "console"
import mongoose, { Schema } from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new mongoose.Schema({
    videoFile: {
        type: String, // url
        required: true
    },    
    thumbnail: {
        type: String,
        required: true
    },    
    title: {
        type: String,
        required: true
    },    
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number, // url se hi milega kyu ki vha upload krenge to vo duration bhi store krta h automatically
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }

}, {timeStamps: true})

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)
import { ApiError } from "./ApiError.js";

// .trim() removes whitespaces
const validateFields = (body, fields) => {
    fields.forEach(element => {
        if(body[element] === "" || body[element].trim() === "")
            throw new ApiError(400, `Please provide ${element} field value`)
    });
}

export { validateFields }
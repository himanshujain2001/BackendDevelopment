// errors ko ek empty array se initilize kiya h because multiple errors ho skte h
// super keyword is used to invoke parent class constructor
class ApiError extends Error {
    constructor(statusCode,message = "Something went wrong.",errors = [],stack = "")
    {
        super(message)
        this.statusCode = statusCode
        this.errors = errors
        this.message = message
        this.success = false
        this.data = null

        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { ApiError }
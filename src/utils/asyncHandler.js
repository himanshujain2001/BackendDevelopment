// since requestHandler is an async functn and we know that async funtn returns a promise. So, Promise.resolve here making sure that the promise
// returned by requestHandler functn will remains a promise.
const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve( requestHandler(req,res,next)).catch((err) => next(err))
    }
}

export { asyncHandler }
// since requestHandler is an async functn and we know that async funtn returns a promise. So, Promise.resolve here making sure that the promise
// returned by requestHandler functn will remains a promise.
// next(err): agar koi error aayega to ye error ko directly error handler ko vo error de dega aage ki process ko stop kr k
const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve( requestHandler(req,res,next)).catch((err) => next(err))
    }
}

export { asyncHandler }
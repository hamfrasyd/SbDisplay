using SbDisplayLib.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SbDisplayLib.Common
{
    /// <summary>
    /// represents the result of an operation that can either be a success with a value of type T or a failure with an error code and message.
    /// </summary>
    /// <typeparam name="T">Type Parameter</typeparam>
    public class Result<T>
    {
        /// <summary>
        /// value is the value that is returned when an operation is successful. This value is null when the operation fails.
        /// </summary>
        public T? Value { get; }
        /// <summary>
        /// errormessage contains a description of the error if the operation fails. This value is null for a successful operation.
        /// </summary>
        public string? ErrorMessage { get; }
        /// <summary>
        /// Error contains an error code that indicates the type of error if the operation fails. This value is null for a successful operation.
        /// </summary>
        public ErrorCode? Error { get; }
        /// <summary>
        /// IsSuccess is a boolean property that indicates whether the operation was successful (true) or a failure (false).
        /// </summary>
        public bool IsSuccess => Error is null;


        /// <summary>
        /// Creates a new instance of the <see cref="Result{T}"/> class representing a successful result with the specified value.
        /// </summary>
        /// <param name="value">value that is returned when an operation is successful</param>
        private Result(T value)
        {
            Value = value;
        }

        /// <summary>
        /// creates a new instance of the <see cref="Result{T}"/> class representing a failed result with the specified error code and message.
        /// </summary>
        /// <param name="error">The error type</param>
        /// <param name="message">Message that describes the error</param>
        private Result(ErrorCode error, string message)
        {
            Error = error;
            ErrorMessage = message;
        }


        /// <summary>
        /// creates a successful result with the specified value.
        /// </summary>
        /// <param name="value">value is the value that is returned when an operation is successful.</param>
        /// <returns>returns a <see cref="Result{T}"/> object that represents a successful operation containing the provided value.</returns>
        public static Result<T> Ok(T value)
        {
            return new Result<T>(value);
        }


        /// <summary>
        /// creates a failed result with the specified error code and message.
        /// 
        /// </summary>
        /// <param name="error">error is the error code that indicates the type of error.</param>
        /// <param name="message">Message is a string that describes the error in more detail.</param>
        /// <returns>a <see cref="Result{T}"/> object that represents a failed operation containing the provided error code and message..</returns>
        public static Result<T> Fail(ErrorCode error, string message)
        {
            return new Result<T>(error, message);
        }


        /// <summary>
        /// tries to get the value from the result.
        /// </summary>
        /// <param name="value">value is assigned the value of the result if the operation was successful</param>
        /// <returns>returns true if the operation was successful and contains a value, otherwise returns false.</returns>
        public bool TryGetValue(out T value)
        {
            if (IsSuccess && Value is not null)
            {
                value = Value;
                return true;
            }
            value = default!;
            return false;
        }

        /// <summary>
        /// Converts a failed Result<T> into a failed Result<U>, preserving the error.
        /// Only valid on failures — calling this on a success result throws.
        /// </summary>
        public Result<U> PropagateFailure<U>()
        {
            if (IsSuccess)
                throw new InvalidOperationException(
                    "Cannot propagate failure from a successful result.");

            return Result<U>.Fail(Error!.Value, ErrorMessage!);
        }
    }
}

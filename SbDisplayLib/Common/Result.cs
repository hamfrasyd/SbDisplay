using SbDisplayLib.Enums;

namespace SbDisplayLib.Common
{
    public class Result<T>
    {
        public T? Value { get; }
        public string? ErrorMessage { get; }
        public ErrorCode? Error { get; }
        public bool IsSuccess => Error is null;

        private Result(T value)
        {
            Value = value;
        }

        private Result(ErrorCode error, string message)
        {
            Error = error;
            ErrorMessage = message;
        }

        public static Result<T> Ok(T value)
        {
            return new Result<T>(value);
        }

        public static Result<T> Fail(ErrorCode error, string message)
        {
            return new Result<T>(error, message);
        }

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

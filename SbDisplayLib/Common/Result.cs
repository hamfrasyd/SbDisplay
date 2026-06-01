using SbDisplayLib.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SbDisplayLib.Common
{
    /// <summary>
    /// Denne klasse repræsenterer resultatet af en operation, der enten kan være en succes med en værdi af typen T eller en fejl med en fejlkode og besked.
    /// </summary>
    /// <typeparam name="T">Type Parameter</typeparam>
    public class Result<T>
    {
        /// <summary>
        /// Value er den værdi, der returneres ved en succesfuld operation.
        /// </summary>
        public T? Value { get; }
        /// <summary>
        /// ErrorMessage indeholder en beskrivelse af fejlen, hvis operationen mislykkedes. Denne værdi er null ved en succesfuld operation.
        /// </summary>
        public string? ErrorMessage { get; }
        /// <summary>
        /// Error indeholder en fejlkode, der angiver typen af fejl, hvis operationen mislykkedes.
        /// </summary>
        public ErrorCode? Error { get; }
        /// <summary>
        /// IsSuccess er en boolesk egenskab, der indikerer, om operationen var en succes (true) eller en fejl (false).
        /// </summary>
        public bool IsSuccess => Error is null;


        /// <summary>
        /// Opretter et nyt succesfuldt resultat med en værdi.
        /// </summary>
        /// <param name="value">Den værdi, som resultatet skal indeholde.</param>
        private Result(T value)
        {
            Value = value;
        }

        /// <summary>
        /// Opretter et nyt fejlresultat med en fejlkode og en fejlbesked.
        /// </summary>
        /// <param name="error">Fejlkoden, der beskriver typen af fejl.</param>
        /// <param name="message">Beskeden, der beskriver fejlen.</param>
        private Result(ErrorCode error, string message)
        {
            Error = error;
            ErrorMessage = message;
        }


        /// <summary>
        /// Opretter et succesfuldt resultat med den angivne værdi.
        /// </summary>
        /// <param name="value">Den værdi, som resultatet skal indeholde.</param>
        /// <returns>Et succesfuldt <see cref="Result{T}"/>-objekt.</returns>
        public static Result<T> Ok(T value)
        {
            return new Result<T>(value);
        }


        /// <summary>
        /// Opretter et fejlresultat med den angivne fejlkode og fejlbesked.
        /// </summary>
        /// <param name="error">Fejlkoden, der beskriver typen af fejl.</param>
        /// <param name="message">Beskeden, der beskriver fejlen.</param>
        /// <returns>Et fejlet <see cref="Result{T}"/>-objekt.</returns>
        public static Result<T> Fail(ErrorCode error, string message)
        {
            return new Result<T>(error, message);
        }


        /// <summary>
        /// Forsøger at hente værdien fra resultatet.
        /// </summary>
        /// <param name="value">Indeholder værdien, hvis operationen var succesfuld.</param>
        /// <returns><c>true</c>, hvis resultatet er succesfuldt og indeholder en værdi. Ellers returneres <c>false</c>.</returns>
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

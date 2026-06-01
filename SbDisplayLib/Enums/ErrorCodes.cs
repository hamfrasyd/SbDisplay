using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SbDisplayLib.Enums
{
    /// <summary>
    /// Enum representing different types of error codes that can occur when interacting with external APIs or performing operations within the application. 
    /// These error codes are used to categorize and identify specific failure scenarios, making it easier to handle errors and provide meaningful feedback to users or developers.
    /// </summary>
    public enum ErrorCode
    {
        NotFound,
        ExternalApiFailure,
        DatabaseFailure,
        InvalidInput,
        Unknown
    }
}

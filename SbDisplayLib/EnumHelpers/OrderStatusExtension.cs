using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace SbDisplayLib.EnumHelpers
{
    /// <summary>
    /// this static class provides an extension method for enums to retrieve the display name defined by the DisplayAttribute.
    /// </summary>
    public static class OrderStatusExtension
    {
        /// <summary>
        /// Gets the display name of an enum value based on the DisplayAttribute applied to it. If the DisplayAttribute is not present, it returns the enum value's name as a string.
        /// </summary>
        /// <param name="value">The enum value to get the display name from.</param>
        /// <returns>The display name defined by the <see cref="DisplayAttribute"/>, or the enum value name if no display name is found.</returns>
        public static string GetDisplayName(this Enum value)
        {
            return value.GetType()
                .GetField(value.ToString())
                ?.GetCustomAttribute<DisplayAttribute>()
                ?.Name ?? value.ToString();
        }
    }
}
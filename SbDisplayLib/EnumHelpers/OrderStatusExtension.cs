using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace SbDisplayLib.EnumHelpers
{
    public static class OrderStatusExtension
    {
        public static string GetDisplayName(this Enum value)
        {
            return value.GetType()
                .GetField(value.ToString())
                ?.GetCustomAttribute<DisplayAttribute>()
                ?.Name ?? value.ToString();
        }
    }
}
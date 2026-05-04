using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

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
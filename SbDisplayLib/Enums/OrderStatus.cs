using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace SbDisplayLib.Enums
{
    public enum OrderStatus
    {
        [Display(Name = "Received")]
        Receieved = 1,

        [Display(Name = "Under Preparation")]
        UnderPreparation = 2,

        [Display(Name = "Ready For Pickup")]
        ReadyForPickup = 3,

        [Display(Name = "Completed")]
        Completed = 4,
    }
}

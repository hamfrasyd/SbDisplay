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
        Receieved,

        [Display(Name = "Under Preparation")]
        UnderPreparation,

        [Display(Name = "Ready For Pickup")]
        ReadyForPickup,

        [Display(Name = "Completed")]
        Completed
    }
}

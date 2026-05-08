using System.ComponentModel.DataAnnotations;

namespace SbDisplayLib.Enums
{
    public enum OrderStatus
    {
        [Display(Name = "Under Preparation")]
        UnderPreparation = 1,

        [Display(Name = "Ready For Pickup")]
        ReadyForPickup = 2,

        [Display(Name = "Completed")]
        Completed = 3
    }
}

using System.ComponentModel.DataAnnotations;

namespace SbDisplayLib.Enums
{
    /// <summary>
    /// The status of an order after a transcation has been made in the ShopBox system.
    /// <br></br>
    /// The status is used to track the progress of an order from the moment it is received until it is completed.
    /// </summary>
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

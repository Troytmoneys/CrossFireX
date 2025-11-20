using UnityEngine;

namespace CrossFireX.Weapons
{
    [CreateAssetMenu(menuName = "CrossFireX/Weapon Definition")]
    public class WeaponDefinition : ScriptableObject
    {
        [SerializeField] private string displayName;
        [SerializeField] private WeaponSlot slot = WeaponSlot.Primary;
        [SerializeField] private float damage = 25f;
        [SerializeField] private float fireRate = 8f;
        [SerializeField] private float spread = 1.5f;
        [SerializeField] private int magazineSize = 30;

        public string DisplayName => displayName;
        public WeaponSlot Slot => slot;
        public float Damage => damage;
        public float FireRate => fireRate;
        public float Spread => spread;
        public int MagazineSize => magazineSize;
    }
}

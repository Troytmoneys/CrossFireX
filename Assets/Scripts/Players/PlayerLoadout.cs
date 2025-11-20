using System;
using CrossFireX.Abilities;
using CrossFireX.Weapons;
using UnityEngine;

namespace CrossFireX.Players
{
    [Serializable]
    public class PlayerLoadout
    {
        [SerializeField] private WeaponDefinition primary;
        [SerializeField] private WeaponDefinition sidearm;
        [SerializeField] private AbilityDefinition ability;

        public WeaponDefinition Primary => primary;
        public WeaponDefinition Sidearm => sidearm;
        public AbilityDefinition Ability => ability;

        public PlayerLoadout(WeaponDefinition primary, WeaponDefinition sidearm, AbilityDefinition ability)
        {
            this.primary = primary;
            this.sidearm = sidearm;
            this.ability = ability;
        }
    }
}

using System;
using UnityEngine;

namespace CrossFireX.Abilities
{
    /// <summary>
    /// Lightweight runtime state for a player's equipped ability.
    /// </summary>
    [Serializable]
    public class AbilityRuntime
    {
        [SerializeField] private AbilityDefinition definition;
        private float nextReadyTime;

        public AbilityDefinition Definition => definition;

        public AbilityRuntime(AbilityDefinition definition)
        {
            this.definition = definition;
        }

        public bool IsReady(float currentTime) => currentTime >= nextReadyTime;

        public bool TryConsume(float currentTime)
        {
            if (!IsReady(currentTime))
            {
                return false;
            }

            nextReadyTime = currentTime + definition.CooldownSeconds;
            return true;
        }
    }
}

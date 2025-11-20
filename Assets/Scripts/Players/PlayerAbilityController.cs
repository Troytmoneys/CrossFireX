using CrossFireX.Abilities;
using UnityEngine;
using UnityEngine.Events;

namespace CrossFireX.Players
{
    /// <summary>
    /// Handles activation of a player's current ability and exposes events for VFX/SFX hooks.
    /// </summary>
    public class PlayerAbilityController : MonoBehaviour
    {
        [SerializeField] private UnityEvent onAbilityActivated;
        [SerializeField] private UnityEvent onAbilityRejected;

        private AbilityRuntime runtime;

        public AbilityDefinition CurrentAbility => runtime?.Definition;

        public void SetAbility(AbilityDefinition definition)
        {
            runtime = definition != null ? new AbilityRuntime(definition) : null;
        }

        public bool TryActivate()
        {
            if (runtime == null)
            {
                onAbilityRejected?.Invoke();
                return false;
            }

            float time = Time.time;
            if (!runtime.TryConsume(time))
            {
                onAbilityRejected?.Invoke();
                return false;
            }

            onAbilityActivated?.Invoke();
            return true;
        }
    }
}

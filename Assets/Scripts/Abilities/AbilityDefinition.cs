using UnityEngine;

namespace CrossFireX.Abilities
{
    /// <summary>
    /// ScriptableObject describing an ability available to the adaptive loadout system.
    /// </summary>
    [CreateAssetMenu(menuName = "CrossFireX/Ability Definition")]
    public class AbilityDefinition : ScriptableObject
    {
        [Header("Identity")]
        [SerializeField] private string displayName;
        [SerializeField, TextArea] private string description;
        [SerializeField] private AbilityCategory category = AbilityCategory.Utility;

        [Header("Timing")]
        [SerializeField] private float cooldownSeconds = 12f;
        [SerializeField] private float durationSeconds = 3f;

        [Header("Tuning")]
        [SerializeField] private float strength = 1f;
        [SerializeField] private float rarityWeight = 1f;
        [SerializeField] private bool requiresGrounded = false;

        public string DisplayName => displayName;
        public string Description => description;
        public AbilityCategory Category => category;
        public float CooldownSeconds => cooldownSeconds;
        public float DurationSeconds => durationSeconds;
        public float Strength => strength;
        public float RarityWeight => Mathf.Max(0.01f, rarityWeight);
        public bool RequiresGrounded => requiresGrounded;
    }
}

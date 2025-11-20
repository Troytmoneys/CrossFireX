using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace CrossFireX.Abilities
{
    /// <summary>
    /// Runtime registry of abilities that can be rolled for a player each round.
    /// </summary>
    [CreateAssetMenu(menuName = "CrossFireX/Ability Pool")]
    public class AbilityPool : ScriptableObject
    {
        [SerializeField] private List<AbilityDefinition> abilities = new List<AbilityDefinition>();

        public IReadOnlyList<AbilityDefinition> AllAbilities => abilities;

        public AbilityDefinition RollAbility(System.Random random, AbilityCategory? forcedCategory = null)
        {
            List<AbilityDefinition> pool = forcedCategory.HasValue
                ? abilities.Where(a => a.Category == forcedCategory.Value).ToList()
                : abilities;

            if (pool.Count == 0)
            {
                Debug.LogWarning("AbilityPool: No abilities available to roll");
                return null;
            }

            float totalWeight = pool.Sum(a => a.RarityWeight);
            double roll = random.NextDouble() * totalWeight;

            foreach (AbilityDefinition ability in pool)
            {
                roll -= ability.RarityWeight;
                if (roll <= 0)
                {
                    return ability;
                }
            }

            return pool[pool.Count - 1];
        }
    }
}
